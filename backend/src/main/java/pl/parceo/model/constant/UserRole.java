package pl.parceo.model.constant;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

@RequiredArgsConstructor
public enum UserRole implements GrantedAuthority {
    OWNER("OWNER"),
    ADMIN("ADMIN"),
    REGULAR("REGULAR"),
    WEB_APP("WEB_APP");

    private final String value;

    @Override
    public String getAuthority() {
        return value;
    }

}