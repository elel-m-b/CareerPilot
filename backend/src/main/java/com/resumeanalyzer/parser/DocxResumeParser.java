package com.resumeanalyzer.parser;

import com.resumeanalyzer.exception.BadRequestException;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class DocxResumeParser {

    public String extractText(InputStream inputStream) {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            String text = extractor.getText();
            if (text == null || text.trim().isEmpty()) {
                throw new BadRequestException("DOCX file contains no readable text");
            }
            return text;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to extract text from DOCX document: " + e.getMessage());
        }
    }
}
