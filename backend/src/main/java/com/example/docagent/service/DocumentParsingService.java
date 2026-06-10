package com.example.docagent.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

@Service
@Slf4j
public class DocumentParsingService {

    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(".pdf", ".doc", ".docx", ".md", ".txt");
    private final Tika tika = new Tika();

    public boolean isSupported(Path path) {
        String suffix = path.getFileName().toString().toLowerCase();
        int dotIndex = suffix.lastIndexOf('.');
        if (dotIndex < 0) {
            return false;
        }
        String ext = suffix.substring(dotIndex);
        return SUPPORTED_EXTENSIONS.contains(ext);
    }

    public String parseFile(Path file) throws IOException {
        if (!Files.exists(file) || !Files.isRegularFile(file)) {
            return "";
        }

        if (!isSupported(file)) {
            log.warn("Unsupported document type for parsing: {}", file);
            return "";
        }

        try (InputStream stream = Files.newInputStream(file)) {
            String text = tika.parseToString(stream);
            return text != null ? text.trim() : "";
        } catch (TikaException e) {
            log.warn("Failed to parse document {}: {}", file, e.getMessage());
            return "";
        }
    }
}
