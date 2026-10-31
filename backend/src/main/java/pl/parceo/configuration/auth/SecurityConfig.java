package pl.parceo.configuration.auth;

import pl.parceo.model.constant.UserRole;
import pl.parceo.service.auth.WebAppAuthFilter;
import pl.parceo.service.core.OrganisationService;
import pl.parceo.service.core.UserService;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.DefaultSecurityFilterChain;

import java.util.Arrays;

import static pl.parceo.model.constant.UserRole.WEB_APP;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] PERMIT_ALL_PATHS = new String[] {
            "/swagger-ui/**",
            "/swagger-ui.html/**",
            "/v3/api-docs/**",
            "/error/**",
            "/auth/login",
            "/auth/register",
    };
    private static final String[] GET_AUTHENTICATED_PATHS = new String[] {
            "/camperPlace/findBy",
            "/camperPlace/calcPrice/**",
            "/camperPlace/occupancy/**",
            "/camperPlace/available/**"
    };
    private static final String[] POST_WEB_APP_PATHS = new String[] {
            "/web/reservation/init",
            "/web/reservation/verify/**",
    };
    private static final String[] POST_AUTHENTICATED_PATHS = new String[] {"/reservation"};

    private static final String[] ALL_AUTHORITIES_WITHOUT_WEB_APP =
            Arrays.stream(UserRole.values())
                    .filter(userRole -> !userRole.equals(WEB_APP))
                    .map(UserRole::getAuthority)
                    .toArray(String[]::new);

    private static final String[] ALL_AUTHORITIES =
            Arrays.stream(UserRole.values()).map(UserRole::getAuthority).toArray(String[]::new);

    private final RsaConfig rsaConfig;
    private final UserService userService;
    private final OrganisationService organisationService;

    @Bean
    AuthenticationManager authenticationManager() {
        var authProvider = new DaoAuthenticationProvider(userService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }

    @Bean
    JwtDecoder decoder() {
        return NimbusJwtDecoder.withPublicKey(this.rsaConfig.publicKey()).build();
    }

    @Bean
    JwtEncoder encoder() {
        final var jwk = new RSAKey.Builder(this.rsaConfig.publicKey()).privateKey(this.rsaConfig.privateKey()).build();
        final var jwks = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwks);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        final var jwtAuthenticationConverter = new JwtAuthenticationConverter();
        final var jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    DefaultSecurityFilterChain securityFilterChain(HttpSecurity http) {
        final var webAppAuthFilter = new WebAppAuthFilter(passwordEncoder(), organisationService, userService);
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PERMIT_ALL_PATHS).permitAll()
                        .requestMatchers(HttpMethod.POST, POST_AUTHENTICATED_PATHS).hasAnyAuthority(ALL_AUTHORITIES_WITHOUT_WEB_APP)
                        .requestMatchers(HttpMethod.GET, GET_AUTHENTICATED_PATHS).hasAnyAuthority(ALL_AUTHORITIES)
                        .requestMatchers(HttpMethod.POST, POST_WEB_APP_PATHS).hasAnyAuthority(WEB_APP.getAuthority())
                        .anyRequest().hasAnyAuthority(ALL_AUTHORITIES_WITHOUT_WEB_APP)
                )
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer((oauth2) -> oauth2.jwt((jwt) -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()).decoder(decoder())))
                .addFilterBefore(webAppAuthFilter, BearerTokenAuthenticationFilter.class)
                .userDetailsService(userService)
                .build();
    }

}
