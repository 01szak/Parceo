package pl.parceo.configuration.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@ConfigurationProperties(prefix = "rsa")
public record RsaConfig(RSAPublicKey publicKey, RSAPrivateKey privateKey) {
}
