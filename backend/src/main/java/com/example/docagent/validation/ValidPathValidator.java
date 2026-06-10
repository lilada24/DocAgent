package com.example.docagent.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * 路径安全校验器 — 拦截路径遍历、空字节注入等攻击
 */
public class ValidPathValidator implements ConstraintValidator<ValidPath, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // 允许 null 或空串（由 @NotBlank 等其他注解负责）
        if (value == null || value.isEmpty()) {
            return true;
        }

        return PathValidator.isSafe(value);
    }
}
