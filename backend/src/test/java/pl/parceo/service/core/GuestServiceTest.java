package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.entity.Guest;
import pl.parceo.repository.GuestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GuestServiceTest {

    @Mock
    private GuestRepository guestRepository;

    @InjectMocks
    private GuestService guestService;

    @Test
    public void shouldCreateGuestSuccessfullyWhenAtLeastOneFieldProvided() {
        // Given
        final var guestDto = new GuestDTO(
                null,
                "Jan",
                null,
                null,
                null,
                null,
                "PL"
        );

        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = guestService.create(guestDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstname()).isEqualTo("Jan");
        assertThat(result.getLastname()).isNull();
        assertThat(result.getCountry()).isEqualTo("PL");

        final var captor = ArgumentCaptor.forClass(Guest.class);
        verify(guestRepository).save(captor.capture());
        assertThat(captor.getValue().getFirstname()).isEqualTo("Jan");
    }

    @Test
    public void shouldThrowUserInputExceptionWhenAllGuestFieldsAreEmptyOrBlank() {
        // Given
        final var emptyGuestDto = new GuestDTO(
                null,
                "",
                "   ",
                "",
                null,
                " ",
                "PL"
        );

        // When & Then
        assertThatThrownBy(() -> guestService.create(emptyGuestDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Utwórz lub podaj istniejącego gościa");

        verify(guestRepository, never()).save(any(Guest.class));
    }

    @Test
    public void shouldMapBlankEmailToNullOnCreation() {
        // Given
        final var guestDtoWithBlankEmail = new GuestDTO(
                null,
                "Jan",
                "Kowalski",
                "   ",
                null,
                null,
                "PL"
        );

        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = guestService.create(guestDtoWithBlankEmail);

        // Then
        assertThat(result.getEmail()).isNull();

        final var captor = ArgumentCaptor.forClass(Guest.class);
        verify(guestRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isNull();
    }

    @Test
    public void shouldDelegateToCreateWhenUpdatingGuestWithNullId() {
        // Given
        final var guestDtoWithoutId = new GuestDTO(
                null,
                "Anna",
                "Nowak",
                "anna@example.com",
                "123456789",
                "WA12345",
                "PL"
        );

        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = guestService.update(guestDtoWithoutId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstname()).isEqualTo("Anna");
        assertThat(result.getLastname()).isEqualTo("Nowak");

        verify(guestRepository).save(any(Guest.class));
        verify(guestRepository, never()).findById(any());
    }

    @Test
    public void shouldUpdateExistingGuestFieldsSuccessfully() {
        // Given
        final var existingGuest = Guest.builder()
                .id(1)
                .firstname("Jan")
                .lastname("Kowalski")
                .email("jan@example.com")
                .phoneNumber("111222333")
                .carRegistration("KR11111")
                .country("PL")
                .build();

        final var updateDto = new GuestDTO(
                1,
                "Jan-Updated",
                "Kowalski-Updated",
                "   ",
                "999888777",
                "KR22222",
                "DE"
        );

        when(guestRepository.findById(1)).thenReturn(Optional.of(existingGuest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = guestService.update(updateDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getFirstname()).isEqualTo("Jan-Updated");
        assertThat(result.getLastname()).isEqualTo("Kowalski-Updated");
        assertThat(result.getEmail()).isNull();
        assertThat(result.getPhoneNumber()).isEqualTo("999888777");
        assertThat(result.getCarRegistration()).isEqualTo("KR22222");
        assertThat(result.getCountry()).isEqualTo("DE");

        verify(guestRepository).findById(1);
        verify(guestRepository).save(existingGuest);
    }
}
