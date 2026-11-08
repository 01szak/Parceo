package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.helper.AuthenticationHelper;
import pl.parceo.model.constant.UserRole;
import pl.parceo.model.entity.Organisation;
import pl.parceo.model.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs without the test transaction of {@link BaseIT}: the data has to be committed so that the worker threads,
 * each with its own transaction, can read it. Everything is removed after each test.
 */
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class OrganisationServiceIT extends BaseIT {

    private static final int ROUNDS = 50;
    private static final long TIMEOUT_SECONDS = 30;

    @Autowired
    private OrganisationService organisationService;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    public void cleanUp() {
        AuthenticationHelper.clearAuthentication();
        jdbc.update("UPDATE app_user SET organisation_id = NULL");
        jdbc.update("DELETE FROM organisation");
        jdbc.update("DELETE FROM app_user");
    }

    @Test
    public void shouldCorrectlyReturnOrganisationDataForUsersFromDifferentOrganisations() throws Exception {
        // Given
        final var forestUser = createUserWithOrganisation("forest_reception", "Leśna Polana", "ul. Leśna 1, Mielno");
        final var seaUser = createUserWithOrganisation("sea_reception", "Morska Zatoka", "ul. Plażowa 7, Łeba");
        final var forestOrganisationId = forestUser.getOrganisation().getId();
        final var seaOrganisationId = seaUser.getOrganisation().getId();

        //both threads wait for each other before every request, so they always ask at the same time
        final var startTogether = new CyclicBarrier(2);

        // When
        final List<Organisation> forestResults;
        final List<Organisation> seaResults;
        try (final var executor = Executors.newFixedThreadPool(2)) {
            final var forestRequests = executor.submit(askForOrganisation(forestUser, startTogether));
            final var seaRequests = executor.submit(askForOrganisation(seaUser, startTogether));
            forestResults = forestRequests.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            seaResults = seaRequests.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        }

        // Then
        assertThat(forestResults).hasSize(ROUNDS).allSatisfy(organisation -> {
            assertThat(organisation.getId()).isEqualTo(forestOrganisationId);
            assertThat(organisation.getOrganisationName()).isEqualTo("Leśna Polana");
            assertThat(organisation.getAddress()).isEqualTo("ul. Leśna 1, Mielno");
        });
        assertThat(seaResults).hasSize(ROUNDS).allSatisfy(organisation -> {
            assertThat(organisation.getId()).isEqualTo(seaOrganisationId);
            assertThat(organisation.getOrganisationName()).isEqualTo("Morska Zatoka");
            assertThat(organisation.getAddress()).isEqualTo("ul. Plażowa 7, Łeba");
        });
    }

    //logs the user in on the worker thread (SecurityContextHolder is per thread) and asks for the organisation ROUNDS times
    private Callable<List<Organisation>> askForOrganisation(User user, CyclicBarrier startTogether) {
        return () -> {
            AuthenticationHelper.authenticateUser(user);
            try {
                final var results = new ArrayList<Organisation>();
                for (int i = 0; i < ROUNDS; i++) {
                    startTogether.await(TIMEOUT_SECONDS, TimeUnit.SECONDS);
                    results.add(organisationService.findLoggedInUserOrganisation());
                }
                return results;
            } finally {
                AuthenticationHelper.clearAuthentication();
            }
        };
    }

    private User createUserWithOrganisation(String login, String organisationName, String address) {
        final var user = userService.create(User.builder()
                .login(login)
                .username(login)
                .email(login + "@example.com")
                .password("testPassword")
                .userRole(UserRole.REGULAR)
                .build());
        final var organisation = organisationService.create(Organisation.builder()
                .owner(user)
                .organisationName(organisationName)
                .address(address)
                .webAppApiKey(login + "-api-key")
                .build());
        user.setOrganisation(organisation);
        return userService.update(user);
    }
}
