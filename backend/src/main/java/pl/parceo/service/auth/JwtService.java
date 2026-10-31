package pl.parceo.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JwtService {

    @Value("${parceo.jwt.exiration-time}")
    private long EXPIRATION_TIME;

    private final JwtEncoder jwtEncoder;

    public String generateToken(Authentication authentication) {
        final var login = authentication.getName();

        final var scope = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(" "));

        final var claims = JwtClaimsSet.builder()
                .subject(login)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(EXPIRATION_TIME))
                .claim("scope", scope)
                .build();

        return this.jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

}

