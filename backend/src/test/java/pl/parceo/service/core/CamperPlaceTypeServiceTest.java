package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.repository.CamperPlaceTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CamperPlaceTypeServiceTest {

    @Mock
    private CamperPlaceTypeRepository camperPlaceTypeRepository;

    @InjectMocks
    private CamperPlaceTypeService camperPlaceTypeService;

    @Test
    public void shouldCreateCamperPlaceTypeSuccessfully() {
        // Given
        final var typeDto = new CamperPlaceTypeDTO(null, "VIP", BigDecimal.valueOf(120));

        when(camperPlaceTypeRepository.save(any(CamperPlaceType.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = camperPlaceTypeService.create(typeDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTypeName()).isEqualTo("VIP");
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(120));

        final var captor = ArgumentCaptor.forClass(CamperPlaceType.class);
        verify(camperPlaceTypeRepository).save(captor.capture());
        assertThat(captor.getValue().getTypeName()).isEqualTo("VIP");
    }

    @Test
    public void shouldThrowIllegalStateExceptionWhenUpdatingTypeWithNullId() {
        // Given
        final var invalidDto = new CamperPlaceTypeDTO(null, "Invalid", BigDecimal.valueOf(50));

        // When & Then
        assertThatThrownBy(() -> camperPlaceTypeService.update(List.of(invalidDto), null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("camperPlaceType with null id!");

        verify(camperPlaceTypeRepository, never()).save(any());
        verify(camperPlaceTypeRepository, never()).saveAll(any());
    }

    @Test
    public void shouldClearPriceOverrideForSelectedCamperPlaces() {
        // Given
        final var cp1 = CamperPlace.builder().id(10).index("10").price(BigDecimal.valueOf(150)).build();
        final var cp2 = CamperPlace.builder().id(20).index("20").price(BigDecimal.valueOf(200)).build();

        final var camperPlaces = new ArrayList<>(List.of(cp1, cp2));
        final var existingType = CamperPlaceType.builder()
                .id(1)
                .typeName("Standard")
                .price(BigDecimal.valueOf(100))
                .camperPlaces(camperPlaces)
                .build();

        final var updateDto = new CamperPlaceTypeDTO(1, "Standard-Updated", BigDecimal.valueOf(110));
        final var cpIdToOverride = List.of(10);

        when(camperPlaceTypeRepository.findById(1)).thenReturn(Optional.of(existingType));
        when(camperPlaceTypeRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = camperPlaceTypeService.update(List.of(updateDto), cpIdToOverride);

        // Then
        assertThat(result).hasSize(1);
        final var updatedType = result.getFirst();
        assertThat(updatedType.getTypeName()).isEqualTo("Standard-Updated");
        assertThat(updatedType.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(110));

        assertThat(cp1.getOverriddenPrice()).isEmpty();
        assertThat(cp2.getOverriddenPrice()).contains(BigDecimal.valueOf(200));
    }

    @Test
    public void shouldPreventDeletingTypeWhenCamperPlacesAreAssigned() {
        // Given
        final var cp = CamperPlace.builder().id(1).index("1").build();
        final var assignedType = CamperPlaceType.builder()
                .id(1)
                .typeName("Assigned")
                .camperPlaces(List.of(cp))
                .build();

        when(camperPlaceTypeRepository.findById(1)).thenReturn(Optional.of(assignedType));

        // When & Then
        assertThatThrownBy(() -> camperPlaceTypeService.deleteById(1))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Nie można usunąć typu parceli do którego są przypisane parcele! Przypisz parcele do innego typu następnie spróbuj ponownie");

        verify(camperPlaceTypeRepository, never()).deleteById(any());
    }

    @Test
    public void shouldDeleteTypeSuccessfullyWhenNoCamperPlacesAssigned() {
        // Given
        final var emptyType = CamperPlaceType.builder()
                .id(2)
                .typeName("EmptyType")
                .camperPlaces(Collections.emptyList())
                .build();

        when(camperPlaceTypeRepository.findById(2)).thenReturn(Optional.of(emptyType));

        // When
        camperPlaceTypeService.deleteById(2);

        // Then
        verify(camperPlaceTypeRepository).deleteById(2);
    }
}
