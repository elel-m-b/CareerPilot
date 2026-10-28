package com.resumeanalyzer.exception;

import com.resumeanalyzer.common.ApiError;
import com.resumeanalyzer.dto.auth.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Proves the {@link GlobalExceptionHandler} still returns the legacy status codes and
 * {@code message} text, while adding the standardised {@code code} field.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private MockHttpServletRequest request(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        return request;
    }

    @Test
    void resourceNotFound_keepsMessageAndAddsCode() {
        ResponseEntity<ApiError> response = handler.handleResourceNotFound(
                new ResourceNotFoundException("Resume not found"), request("/api/resumes/1"));

        assertNotNull(response.getBody());
        assertEquals(404, response.getStatusCode().value());
        assertEquals(404, response.getBody().status());
        assertEquals("Not Found", response.getBody().error());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().code());
        assertEquals("Resume not found", response.getBody().message());
        assertEquals("/api/resumes/1", response.getBody().path());
    }

    @Test
    void badRequest_translatesToBadRequestCode() {
        ResponseEntity<ApiError> response = handler.handleBadRequest(
                new BadRequestException("Malformed input"), request("/api/resumes/upload"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("BAD_REQUEST", response.getBody().code());
        assertEquals("Malformed input", response.getBody().message());
    }

    @Test
    void duplicateResource_mapsToConflict() {
        ResponseEntity<ApiError> response = handler.handleDuplicateResource(
                new DuplicateResourceException("Email already registered"), request("/api/auth/register"));

        assertNotNull(response.getBody());
        assertEquals(409, response.getStatusCode().value());
        assertEquals("DUPLICATE_RESOURCE", response.getBody().code());
        assertEquals("Email already registered", response.getBody().message());
    }

    @Test
    void unsupportedFileType_mapsToBadRequest() {
        ResponseEntity<ApiError> response = handler.handleUnsupportedFileType(
                new UnsupportedFileTypeException("Only PDF and DOCX files are allowed."), request("/api/resumes/upload"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("UNSUPPORTED_FILE_TYPE", response.getBody().code());
    }

    @Test
    void unauthorized_mapsToUnauthorized() {
        ResponseEntity<ApiError> response = handler.handleUnauthorized(
                new UnauthorizedException("Not authenticated"), request("/api/users/me"));

        assertNotNull(response.getBody());
        assertEquals(401, response.getStatusCode().value());
        assertEquals("UNAUTHORIZED", response.getBody().code());
    }

    @Test
    void badCredentials_keepsGenericMessage() {
        ResponseEntity<ApiError> response = handler.handleBadCredentials(
                new BadCredentialsException("Bad credentials"), request("/api/auth/login"));

        assertNotNull(response.getBody());
        assertEquals(401, response.getStatusCode().value());
        assertEquals("INVALID_CREDENTIALS", response.getBody().code());
        assertEquals("Invalid email or password", response.getBody().message());
    }

    @Test
    void validationError_surfacesFirstFieldMessage() {
        BeanPropertyBindingResult binding =
                new BeanPropertyBindingResult(RegisterRequest.builder().build(), "registerRequest");
        binding.rejectValue("email", "NotBlank", "Email is required");
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, binding);

        ResponseEntity<ApiError> response = handler.handleValidationException(ex, request("/api/auth/register"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("VALIDATION_ERROR", response.getBody().code());
        assertEquals("Email is required", response.getBody().message());
    }

    @Test
    void malformedBody_mapsToBadRequest() {
        ResponseEntity<ApiError> response = handler.handleUnreadableBody(
                new HttpMessageNotReadableException("JSON parse error", (org.springframework.http.HttpInputMessage) null),
                request("/api/auth/login"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("INVALID_REQUEST_BODY", response.getBody().code());
        assertEquals("Request body is missing or malformed", response.getBody().message());
    }

    @Test
    void invalidPathVariable_mapsToBadRequest() {
        ResponseEntity<ApiError> response = handler.handleTypeMismatch(
                new MethodArgumentTypeMismatchException("abc", Long.class, "id", null,
                        new NumberFormatException("For input string: \"abc\"")),
                request("/api/resumes/abc"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("INVALID_PARAMETER", response.getBody().code());
        assertEquals("Invalid value for 'id'", response.getBody().message());
    }

    @Test
    void missingMultipartPart_mapsToBadRequest() {
        ResponseEntity<ApiError> response = handler.handleMissingPart(
                new MissingServletRequestPartException("file"), request("/api/resumes/upload"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("MISSING_PART", response.getBody().code());
        assertEquals("Required part 'file' is missing", response.getBody().message());
    }

    @Test
    void missingQueryParameter_mapsToBadRequest() {
        ResponseEntity<ApiError> response = handler.handleMissingParameter(
                new MissingServletRequestParameterException("file", "String"),
                request("/api/resumes/upload"));

        assertNotNull(response.getBody());
        assertEquals(400, response.getStatusCode().value());
        assertEquals("MISSING_PARAMETER", response.getBody().code());
    }

    @Test
    void unsupportedMethod_mapsToMethodNotAllowed() {
        ResponseEntity<ApiError> response = handler.handleMethodNotSupported(
                new HttpRequestMethodNotSupportedException("PATCH"), request("/api/users/me"));

        assertNotNull(response.getBody());
        assertEquals(405, response.getStatusCode().value());
        assertEquals("METHOD_NOT_ALLOWED", response.getBody().code());
        assertEquals("Request method 'PATCH' is not supported", response.getBody().message());
    }

    @Test
    void genericException_mapsToInternalError() {
        ResponseEntity<ApiError> response = handler.handleGenericException(
                new RuntimeException("boom"), request("/api/analyses/1"));

        assertNotNull(response.getBody());
        assertEquals(500, response.getStatusCode().value());
        assertEquals("INTERNAL_ERROR", response.getBody().code());
        assertEquals("An unexpected error occurred: boom", response.getBody().message());
    }
}
