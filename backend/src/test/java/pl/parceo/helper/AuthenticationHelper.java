package pl.parceo.helper;

import pl.parceo.model.entity.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthenticationHelper {

    public static final String IT_USER_LOGIN = "capitan";

    private AuthenticationHelper() {}

    public static void authenticateUser(final User user) {
        final var auth = new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword(), user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    public static void authenticateUser(final String username) {
        final var auth = new UsernamePasswordAuthenticationToken(username, "password");
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    public static void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

}
