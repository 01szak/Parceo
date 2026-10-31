package pl.parceo.service.auth;

import pl.parceo.exception.AuthenticationException;
import pl.parceo.model.entity.User;
import pl.parceo.service.core.OrganisationService;
import pl.parceo.service.core.UserService;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static pl.parceo.model.constant.UserRole.WEB_APP;
import static java.util.concurrent.TimeUnit.MINUTES;

@Log4j2
@RequiredArgsConstructor
public class WebAppAuthFilter extends OncePerRequestFilter {

    private static final String ORGANISATION_ID_HEADER = "X-org-id";
    private static final String API_KEY_HEADER = "X-api-key";

    private final PasswordEncoder passwordEncoder;
    private final OrganisationService organisationService;
    private final UserService userService;
    private final Cache<String, User> authCache = Caffeine.newBuilder()
            .expireAfterWrite(5, MINUTES)
            .maximumSize(200)
            .build();


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        var orgId = request.getHeader(ORGANISATION_ID_HEADER);
        var apiKey = request.getHeader(API_KEY_HEADER);
        var headersPresent = orgId != null && apiKey != null;
        try {
            if (headersPresent) {
                var appUser = authCache.getIfPresent(getCacheKey(orgId, apiKey));

                Optional.ofNullable(appUser).ifPresentOrElse(
                        this::authoriseUser,
                        () -> authenticateUser(orgId, apiKey)
                );
            }
        } catch (AuthenticationException | NumberFormatException | NoSuchElementException e) {
            SecurityContextHolder.clearContext();
            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid web application credentials"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateUser(String orgId, String apiKey) {
        log.info("Web app auth headers found, starting Authentication for orgId: {}", orgId);

        var organisation = organisationService.findById(Integer.parseInt(orgId));

        var appUser = userService.findWebAppUser(Integer.parseInt(orgId))
                .orElseThrow(() -> new AuthenticationException("No web app associated for the given organisation"));

        if (passwordEncoder.matches(apiKey, organisation.getWebAppApiKey())) {
            authoriseUser(appUser);
            log.info("Web app authentication succeeded for orgId: {}", orgId);
        } else {
            throw new AuthenticationException("Api key not matched");
        }
        authCache.put(getCacheKey(orgId, apiKey), appUser);

    }

    private void authoriseUser(User appUser) {
        var auth = new UsernamePasswordAuthenticationToken(
                appUser.getLogin(),
                null,
                List.of(new SimpleGrantedAuthority(WEB_APP.getAuthority()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String getCacheKey(String orgId, String apiKey) {
        return orgId + ":" + apiKey;
    }

}
