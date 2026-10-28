-- A DOCX upload arrives with its full MIME type
-- (application/vnd.openxmlformats-officedocument.wordprocessingml.document, 71
-- characters), which did not fit in the original VARCHAR(50) and caused a 500
-- on upload. Widen the column to hold any registered MIME type.
--
-- Valid on MySQL (prod) and H2 in MySQL compatibility mode (dev).

ALTER TABLE resumes MODIFY COLUMN file_type VARCHAR(150) NOT NULL;
