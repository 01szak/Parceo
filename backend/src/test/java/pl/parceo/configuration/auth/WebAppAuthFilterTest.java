package pl.parceo.configuration.auth;

import pl.parceo.helper.AuthenticationHelper;
import pl.parceo.model.constant.UserRole;
import pl.parceo.model.entity.Organisation;
import pl.parceo.model.entity.User;
import pl.parceo.service.auth.WebAppAuthFilter;
import pl.parceo.service.core.OrganisationService;
import pl.parceo.service.core.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WebAppAuthFilterTest {

    private static final String ORGANISATION_ID_HEADER = "X-org-id";
    private static final String API_KEY_HEADER = "X-api-key";

    private static final String ORG_ID_STR = "10";
    private static final int ORG_ID = 10;
    private static final String RAW_API_KEY = "secret-raw-api-key";
    private static final String ENCODED_API_KEY = "$2a$10$encodedApiKeyHash";

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OrganisationService organisationService;

    @Mock
    private UserService userService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private WebAppAuthFilter authFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    private Organisation testOrganisation;
    private User testUser;

    @BeforeEach
    public void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        AuthenticationHelper.clearAuthentication();

        testOrganisation = Organisation.builder()
                .id(ORG_ID)
                .organisationName("Camper Park Stary Folwark")
                .address("Stary Folwark 1")
                .webAppApiKey(ENCODED_API_KEY)
                .build();

        testUser = User.builder()
                .id(1)
                .login("web-app-client")
                .username("web-app-client")
                .userRole(UserRole.WEB_APP)
                .organisation(testOrganisation)
                .build();
    }

    @AfterEach
    public void tearDown() {
        AuthenticationHelper.clearAuthentication();
    }

    @Test
    public void shouldPassThroughWhenNoHeadersPresent() throws ServletException, IOException {
        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(organisationService, never()).findById(anyInt());
        verify(userService, never()).findWebAppUser(anyInt());
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    public void shouldPassThroughWhenOnlyOrganisationIdHeaderPresent() throws ServletException, IOException {
        // Given
        request.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(organisationService, never()).findById(anyInt());
        verify(userService, never()).findWebAppUser(anyInt());
    }

    @Test
    public void shouldPassThroughWhenOnlyApiKeyHeaderPresent() throws ServletException, IOException {
        // Given
        request.addHeader(API_KEY_HEADER, RAW_API_KEY);

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(organisationService, never()).findById(anyInt());
        verify(userService, never()).findWebAppUser(anyInt());
    }

    @Test
    public void shouldAuthenticateSuccessfullyAndPopulateSecurityContextOnCacheMiss() throws ServletException, IOException {
        // Given
        request.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);
        request.addHeader(API_KEY_HEADER, RAW_API_KEY);

        when(organisationService.findById(ORG_ID)).thenReturn(testOrganisation);
        when(userService.findWebAppUser(ORG_ID)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(RAW_API_KEY, ENCODED_API_KEY)).thenReturn(true);

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        final Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(testUser.getLogin());
        assertThat(auth.getAuthorities())
                .extracting("authority")
                .containsExactly(UserRole.WEB_APP.getAuthority());

        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }

    @Test
    public void shouldAuthenticateFromCacheOnSubsequentRequestWithoutCallingServices() throws ServletException, IOException {
        // Given
        request.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);
        request.addHeader(API_KEY_HEADER, RAW_API_KEY);

        when(organisationService.findById(ORG_ID)).thenReturn(testOrganisation);
        when(userService.findWebAppUser(ORG_ID)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(RAW_API_KEY, ENCODED_API_KEY)).thenReturn(true);

        // First call - Cache Miss
        authFilter.doFilter(request, response, filterChain);

        // Second call - Cache Hit
        final var secondRequest = new MockHttpServletRequest();
        secondRequest.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);
        secondRequest.addHeader(API_KEY_HEADER, RAW_API_KEY);
        final var secondResponse = new MockHttpServletResponse();
        AuthenticationHelper.clearAuthentication();

        // When
        authFilter.doFilter(secondRequest, secondResponse, filterChain);

        // Then
        final Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(testUser.getLogin());
        assertThat(auth.getAuthorities())
                .extracting("authority")
                .containsExactly(UserRole.WEB_APP.getAuthority());

        // Verify services were invoked only once during first call
        verify(organisationService, times(1)).findById(ORG_ID);
        verify(userService, times(1)).findWebAppUser(ORG_ID);
        verify(passwordEncoder, times(1)).matches(RAW_API_KEY, ENCODED_API_KEY);
        verify(filterChain).doFilter(secondRequest, secondResponse);
    }

    @Test
    public void shouldReturnUnauthorizedWhenOrganisationIdIsNotNumeric() throws ServletException, IOException {
        // Given
        request.addHeader(ORGANISATION_ID_HEADER, "invalid-non-numeric-id");
        request.addHeader(API_KEY_HEADER, RAW_API_KEY);

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid web application credentials");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    public void shouldReturnUnauthorizedWhenOrganisationNotFound() throws ServletException, IOException {
        // Given
        request.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);
        request.addHeader(API_KEY_HEADER, RAW_API_KEY);

        when(organisationService.findById(ORG_ID)).thenThrow(new NoSuchElementException("Organisation not found"));

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid web application credentials");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    public void shouldReturnUnauthorizedWhenNoWebAppUserExistsForOrganisation() throws ServletException, IOException {
        // Given
        request.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);
        request.addHeader(API_KEY_HEADER, RAW_API_KEY);

        when(organisationService.findById(ORG_ID)).thenReturn(testOrganisation);
        when(userService.findWebAppUser(ORG_ID)).thenReturn(Optional.empty());

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid web application credentials");
        verify(filterChain, never()).doFilter(any(), any());
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    public void shouldReturnUnauthorizedWhenApiKeyDoesNotMatch() throws ServletException, IOException {
        // Given
        final var invalidApiKey = "wrong-api-key";
        request.addHeader(ORGANISATION_ID_HEADER, ORG_ID_STR);
        request.addHeader(API_KEY_HEADER, invalidApiKey);

        when(organisationService.findById(ORG_ID)).thenReturn(testOrganisation);
        when(userService.findWebAppUser(ORG_ID)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(invalidApiKey, ENCODED_API_KEY)).thenReturn(false);

        // When
        authFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid web application credentials");
        verify(filterChain, never()).doFilter(any(), any());
    }
}
