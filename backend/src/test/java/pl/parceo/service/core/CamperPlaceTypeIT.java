package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.model.constant.Operation;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import jakarta.annotation.Nullable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class CamperPlaceTypeIT extends BaseIT {

    @Autowired
    private CamperPlaceTypeService camperPlaceTypeService;

    @Autowired
    private CamperPlaceService camperPlaceService;

    @Test
    public void shouldFallbackToTypePriceWhenNoOverride() {
        // Given
        var type = camperPlaceTypeService.create(new CamperPlaceType("Standard", new BigDecimal("50.00")));
        var camperPlace = camperPlaceService.create(CamperPlace.builder()
                .index("A1")
                .camperPlaceType(type)
                .price(null)
                .build());

        // When & Then
        assertThat(camperPlace.getPrice()).isEqualByComparingTo("50.00");

        cleanup(List.of(camperPlace), List.of(type));
    }

    @Test
    public void shouldRespectOverridePriceWhenPresent() {
        // Given
        var type = camperPlaceTypeService.create(new CamperPlaceType("Standard", new BigDecimal("50.00")));
        var camperPlace = camperPlaceService.create(CamperPlace.builder()
                .index("A2")
                .camperPlaceType(type)
                .price(new BigDecimal("75.00"))
                .build());

        // When & Then
        assertThat(camperPlace.getPrice()).isEqualByComparingTo("75.00");

        cleanup(List.of(camperPlace), List.of(type));
    }

    @Test
    public void shouldReflectNewTypePriceOnlyOnNonOverriddenPlaces() {
        // Given
        var type = camperPlaceTypeService.create(new CamperPlaceType("Dynamic", new BigDecimal("50.00")));
        
        var placeWithFallback = camperPlaceService.create(CamperPlace.builder()
                .index("D1").camperPlaceType(type).price(null).build());
        
        var placeWithOverride = camperPlaceService.create(CamperPlace.builder()
                .index("D2").camperPlaceType(type).price(new BigDecimal("100.00")).build());

        // When
        var updateDto = new CamperPlaceTypeDTO(type.getId(), "Dynamic", new BigDecimal("60.00"));
        var createdCamperPlaceType = camperPlaceTypeService.update(List.of(updateDto), List.of());

        // Then
        assertThat(camperPlaceService.findById(placeWithFallback.getId()).getPrice()).isEqualByComparingTo("60.00");
        assertThat(camperPlaceService.findById(placeWithOverride.getId()).getPrice()).isEqualByComparingTo("100.00");

        createdCamperPlaceType.add(type);
        cleanup(List.of(placeWithOverride, placeWithFallback), createdCamperPlaceType);
    }

    @Test
    public void shouldClearOverridesViaService() {
        // Given
        var type = camperPlaceTypeService.create(new CamperPlaceType("ClearTest", new BigDecimal("50.00")));
        var place = CamperPlace.builder()
                .index("C1").price(new BigDecimal("99.00")).build();
        place.setCamperPlaceType(type); // Synchronizuje obie strony relacji
        camperPlaceService.create(place);

        assertThat(type.getCamperPlaces()).isNotEmpty();
        assertThat(place.getPrice()).isEqualByComparingTo("99.00");

        // When
        var updateTypeDto = new CamperPlaceTypeDTO(type.getId(), "ClearTest", new BigDecimal("50.00"));
        var updatedCamperPlaceType = camperPlaceTypeService.update(List.of(updateTypeDto), List.of(place.getId()));

        // Then
        var updatedPlace = camperPlaceService.findById(place.getId());
        assertThat(updatedPlace.getOverriddenPrice()).isEmpty();
        assertThat(updatedPlace.getPrice()).isEqualByComparingTo("50.00");

        updatedCamperPlaceType.add(type);
        cleanup(List.of(place), updatedCamperPlaceType);
    }

    @Test
    public void shouldHandleMassCreationAndUpdatingOfTypes() {
        // Given
        var existingType = camperPlaceTypeService.create(new CamperPlaceType("OldType", new BigDecimal("40.00")));

        var updated = new CamperPlaceTypeDTO(existingType.getId(), "UpdatedOldType", new BigDecimal("45.00"));
        var newT = new CamperPlaceTypeDTO(null, "BrandNewType", new BigDecimal("100.00"));

        // When
        var updatedRes = camperPlaceTypeService.update(List.of(updated), List.of());
        var createdRes = camperPlaceTypeService.create(newT);

        // Then
        assertThat(updatedRes).hasSize(1);
        assertThat(camperPlaceTypeService.findBy(SearchCriteria.builder().key("typeName").operation(Operation.EQUALS).value("UpdatedOldType").build()).getContent()).isNotEmpty();
        assertThat(camperPlaceTypeService.findBy(SearchCriteria.builder().key("typeName").operation(Operation.EQUALS).value("BrandNewType").build()).getContent()).isNotEmpty();

        cleanup(null, List.of(createdRes));
        cleanup(null, updatedRes);
    }

    private void cleanup(@Nullable List<CamperPlace> cps, @Nullable List<CamperPlaceType> cpts) {
        if (cps != null) {
            camperPlaceService.deleteAll(cps);
        }
        if (cpts != null) {
            camperPlaceTypeService.deleteAll(cpts);
        }
    }
}
