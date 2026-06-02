package com.example.docagent.config;

import com.example.docagent.entity.User;
import com.example.docagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 数据初始化器：后端启动时自动创建默认用户（解决 H2 内存数据库重启丢数据的问题）
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@docagent.local")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("管理员")
                    .enabled(true)
                    .accountNonLocked(true)
                    .accountNonExpired(true)
                    .credentialsNonExpired(true)
                    .build();

            userRepository.save(admin);
            log.info("============================================");
            log.info("  默认管理员账号已创建：");
            log.info("  用户名: admin");
            log.info("  密码:   admin123");
            log.info("============================================");
        } else {
            log.info("数据库已有 {} 个用户，跳过初始化", userRepository.count());
        }
    }
}
