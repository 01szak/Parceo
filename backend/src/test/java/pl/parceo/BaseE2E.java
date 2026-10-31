package pl.parceo;

import pl.parceo.model.constant.UserRole;
import pl.parceo.model.entity.Organisation;
import pl.parceo.model.entity.User;
import pl.parceo.service.core.OrganisationService;
import pl.parceo.service.core.UserService;
import co.novu.Novu;
import co.novu.models.operations.EventsControllerTriggerRequestBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

/**
 * Shared setup for end-to-end tests: a random-port application backed by a Testcontainers MySQL,
 * a {@link RestTestClient} pointed at it, an authenticated web-app {@link Organisation} (API key
 * {@link #API_KEY}), a mocked {@link Novu} client and a full table wipe after every test.
 *
 * <p>The scheduled task delays are pushed out so E2E tests can drive the async pipeline by calling
 * {@code TaskProcessor#processTasks()} themselves instead of racing the scheduler.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class BaseE2E extends AbstractMySqlContainerTest {

    protected static final String API_KEY = "e2e-secret-api-key";

    @LocalServerPort
    protected int port;

    @MockitoBean
    protected Novu novu;

    @Autowired
    protected JdbcTemplate jdbc;
    @Autowired
    protected PasswordEncoder passwordEncoder;
    @Autowired
    protected UserService userService;
    @Autowired
    protected OrganisationService organisationService;

    protected RestTestClient client;
    protected Organisation organisation;
    protected User webAppUser;

    @BeforeEach
    void baseE2ESetUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        var owner = userService.create(User.builder()
                .login("e2e-owner").username("e2e-owner").email("owner@example.com")
                .password("x").userRole(UserRole.OWNER).build());
        organisation = organisationService.create(Organisation.builder()
                .owner(owner).organisationName("E2E Org").address("Somewhere 1")
                .webAppApiKey(passwordEncoder.encode(API_KEY))
                .build());
        webAppUser = userService.create(User.builder()
                .login("e2e-web-app").username("e2e-web-app").email("webapp@example.com")
                .password("x").userRole(UserRole.WEB_APP).organisation(organisation).build());

        var triggerBuilder = mock(EventsControllerTriggerRequestBuilder.class);
        lenient().when(novu.trigger()).thenReturn(triggerBuilder);
        lenient().when(triggerBuilder.body(any())).thenReturn(triggerBuilder);
    }

    @AfterEach
    void baseE2ECleanUp() {
        jdbc.update("DELETE FROM system_task");
        jdbc.update("DELETE FROM reservation");
        jdbc.update("DELETE FROM guest");
        jdbc.update("DELETE FROM camper_place");
        jdbc.update("DELETE FROM camper_place_type");
        jdbc.update("UPDATE app_user SET organisation_id = NULL");
        jdbc.update("DELETE FROM organisation");
        jdbc.update("DELETE FROM app_user");
    }

    protected String orgId() {
        return String.valueOf(organisation.getId());
    }
}
