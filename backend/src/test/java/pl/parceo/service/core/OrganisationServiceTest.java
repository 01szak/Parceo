package pl.parceo.service.core;

import pl.parceo.model.entity.User;
import pl.parceo.repository.OrganisationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OrganisationServiceTest {

    @Mock
    private OrganisationRepository organisationRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private OrganisationService organisationService;

    @Test
    public void shouldThrowIllegalStateExceptionWhenLoggedInUserHasNoOrganisation() {
        // Given
        final var user = User.builder().login("recepcja").build();

        when(userService.getLoggedInUser()).thenReturn(user);

        // When & Then
        assertThatThrownBy(() -> organisationService.findLoggedInUserOrganisation())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not assigned to any organisation");

        verify(organisationRepository, never()).findById(anyInt());
    }
}
