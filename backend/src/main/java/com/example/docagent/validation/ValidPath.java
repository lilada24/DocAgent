package com.example.docagent.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 自定义校验注解 — 验证路径不包含路径遍历等攻击字符
 */
@Documented
@Constraint(validatedBy = ValidPathValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPath {

    String message() default "Path contains illegal traversal sequences";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
