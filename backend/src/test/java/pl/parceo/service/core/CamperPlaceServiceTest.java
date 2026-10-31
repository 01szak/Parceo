package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.repository.CamperPlaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CamperPlaceServiceTest {

    @Mock
    private CamperPlaceRepository camperPlaceRepository;

    @Mock
    private CamperPlaceTypeService camperPlaceTypeService;

    @Mock
    private ReservationCalculatorService reservationCalculatorService;

    @InjectMocks
    private CamperPlaceService camperPlaceService;

    private CamperPlaceType defaultType;
    private static final BigDecimal TYPE_PRICE = BigDecimal.valueOf(100);

    @BeforeEach
    public void setUp() {
        defaultType = CamperPlaceType.builder()
                .id(1)
                .typeName("Standard")
                .price(TYPE_PRICE)
                .build();
    }

    @Test
    public void shouldCreateCamperPlaceWithExplicitIndex() {
        // Given
        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", TYPE_PRICE);
        final var cpDto = new CamperPlaceDTO(null, "10A", typeDto, null);

        when(camperPlaceTypeService.findById(1)).thenReturn(defaultType);
        when(camperPlaceRepository.save(any(CamperPlace.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = camperPlaceService.create(cpDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIndex()).isEqualTo("10A");
        assertThat(result.getCamperPlaceType()).isEqualTo(defaultType);

        final var captor = ArgumentCaptor.forClass(CamperPlace.class);
        verify(camperPlaceRepository).save(captor.capture());
        assertThat(captor.getValue().getIndex()).isEqualTo("10A");
    }

    @Test
    public void shouldAutoGenerateNextIndexWhenIndexIsNull() {
        // Given
        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", TYPE_PRICE);
        final var cpDto = new CamperPlaceDTO(null, null, typeDto, null);

        when(camperPlaceTypeService.findById(1)).thenReturn(defaultType);
        when(camperPlaceRepository.getCamperplaceMaxIndex()).thenReturn("5");
        when(camperPlaceRepository.save(any(CamperPlace.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = camperPlaceService.create(cpDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIndex()).isEqualTo("6");

        verify(camperPlaceRepository).getCamperplaceMaxIndex();
    }

    @Test
    public void shouldThrowIllegalArgumentExceptionWhenTypeIsNotFound() {
        // Given
        final var typeDto = new CamperPlaceTypeDTO(999, "Unknown", TYPE_PRICE);
        final var cpDto = new CamperPlaceDTO(null, "1", typeDto, null);

        when(camperPlaceTypeService.findById(999)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> camperPlaceService.create(cpDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid camperPlaceType");

        verify(camperPlaceRepository, never()).save(any(CamperPlace.class));
    }

    @Test
    public void shouldThrowUserInputExceptionWhenIndexIsEmptyOrBlank() {
        // Given
        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", TYPE_PRICE);
        final var cpDto = new CamperPlaceDTO(null, "   ", typeDto, null);

        when(camperPlaceTypeService.findById(1)).thenReturn(defaultType);

        // When & Then
        assertThatThrownBy(() -> camperPlaceService.create(cpDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Indeks nie może być pusty");

        verify(camperPlaceRepository, never()).save(any(CamperPlace.class));
    }

    @Test
    public void shouldThrowUserInputExceptionWhenIndexDoesNotStartWithDigit() {
        // Given
        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", TYPE_PRICE);
        final var cpDto = new CamperPlaceDTO(null, "A1", typeDto, null);

        when(camperPlaceTypeService.findById(1)).thenReturn(defaultType);

        // When & Then
        assertThatThrownBy(() -> camperPlaceService.create(cpDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Indeks musi zaczynać się od cyfry");

        verify(camperPlaceRepository, never()).save(any(CamperPlace.class));
    }

    @Test
    public void shouldSetOverriddenPriceToNullWhenMatchingTypePriceInUpdateAll() {
        // Given
        final var existingCp = CamperPlace.builder()
                .id(1)
                .index("1")
                .camperPlaceType(defaultType)
                .price(BigDecimal.valueOf(150))
                .build();

        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", TYPE_PRICE);
        final var updateDto = new CamperPlaceDTO(1, "1", typeDto, TYPE_PRICE);

        when(camperPlaceRepository.findById(1)).thenReturn(Optional.of(existingCp));
        when(camperPlaceTypeService.findById(1)).thenReturn(defaultType);
        when(camperPlaceRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = camperPlaceService.updateAll(List.of(updateDto));

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getOverriddenPrice()).isEmpty();
        assertThat(result.getFirst().getPrice()).isEqualByComparingTo(TYPE_PRICE);
    }

    @Test
    public void shouldKeepCustomOverriddenPriceWhenDifferentFromTypePrice() {
        // Given
        final var existingCp = CamperPlace.builder()
                .id(1)
                .index("1")
                .camperPlaceType(defaultType)
                .price(null)
                .build();

        final var customPrice = BigDecimal.valueOf(175);
        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", TYPE_PRICE);
        final var updateDto = new CamperPlaceDTO(1, "1", typeDto, customPrice);

        when(camperPlaceRepository.findById(1)).thenReturn(Optional.of(existingCp));
        when(camperPlaceTypeService.findById(1)).thenReturn(defaultType);
        when(camperPlaceRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = camperPlaceService.updateAll(List.of(updateDto));

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getOverriddenPrice()).contains(customPrice);
        assertThat(result.getFirst().getPrice()).isEqualByComparingTo(customPrice);
    }
}
