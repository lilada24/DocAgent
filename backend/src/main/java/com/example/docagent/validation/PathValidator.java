package com.example.docagent.validation;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Pattern;

/**
 * 路径安全校验工具类 — 防止路径遍历攻击
 */
public final class PathValidator {

    private static final Pattern TRAVERSAL_PATTERN = Pattern.compile("\\.\\.[/\\\\]");
    private static final Pattern NULL_BYTE_PATTERN = Pattern.compile("%00|\0");
    private static final Pattern DANGEROUS_CHARS = Pattern.compile("[<>|\"*?]");

    private PathValidator() {
        // 工具类禁止实例化
    }

    /**
     * 检查路径是否安全（不包含路径遍历等攻击字符）
     */
    public static boolean isSafe(String path) {
        if (path == null || path.isBlank()) {
            return false;
        }

        // 拒绝包含 ".." + 路径分隔符 的路径遍历
        if (TRAVERSAL_PATTERN.matcher(path).find()) {
            return false;
        }

        // 拒绝空字节注入
        if (NULL_BYTE_PATTERN.matcher(path).find()) {
            return false;
        }

        // 拒绝危险字符
        if (DANGEROUS_CHARS.matcher(path).find()) {
            return false;
        }

        return true;
    }

    /**
     * 规范化路径并再次验证，作为纵深防御
     *
     * @param rawPath 原始路径
     * @return 规范化后的路径
     * @throws IllegalArgumentException 如果路径包含遍历序列
     */
    public static String normalize(String rawPath) {
        if (!isSafe(rawPath)) {
            throw new IllegalArgumentException("Path contains unsafe traversal sequences: " + rawPath);
        }

        Path normalized = Paths.get(rawPath).normalize();
        String result = normalized.toString();

        // 规范化后再检查一次
        if (TRAVERSAL_PATTERN.matcher(result).find()) {
            throw new IllegalArgumentException("Path normalization revealed traversal: " + rawPath);
        }

        return result;
    }
}
