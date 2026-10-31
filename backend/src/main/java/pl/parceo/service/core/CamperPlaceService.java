package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.CamperPlaceRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.SQLIntegrityConstraintViolationException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CamperPlaceService extends CRUDServiceImpl<CamperPlace> {

    private static final int DUPLICATE_ENTRY = 1062;

    private final CamperPlaceRepository camperPlaceRepository;
    private final CamperPlaceTypeService camperPlaceTypeService;
    private final ReservationCalculatorService reservationCalculatorService;

    public CamperPlace create(CamperPlaceDTO camperPlaceDto) {
        var camperPlaceType = camperPlaceTypeService.findById(camperPlaceDto.camperPlaceType().id());

        if (camperPlaceType == null) {
            throw new IllegalArgumentException("Invalid camperPlaceType");
        }
        var cpIndex = camperPlaceDto.index() != null ? camperPlaceDto.index() : generateNextIndex();
        validateIndex(cpIndex);

        try {
            return create(CamperPlace.builder()
                    .index(cpIndex)
                    .camperPlaceType(camperPlaceType)
                    .build()
            );
        } catch (DataIntegrityViolationException e) {
            var cause =  e.getMostSpecificCause();
            if (cause instanceof SQLIntegrityConstraintViolationException sqlEx && DUPLICATE_ENTRY == sqlEx.getErrorCode()) {
                throw new UserInputException("Parcela z podanym indexem już istnieje");
            }
            throw new IllegalStateException();
        }
    }

    private void validateIndex(String cpIndex) {
        if (cpIndex == null || cpIndex.isBlank()) {
            throw new UserInputException("Indeks nie może być pusty");
        }
        var firstEl = String.valueOf(cpIndex.charAt(0));
        try {
            Integer.parseInt(firstEl);
        } catch (NumberFormatException e) {
            throw new UserInputException("Indeks musi zaczynać się od cyfry");
        }
    }

    private String generateNextIndex() {
        var maxIndex = camperPlaceRepository.getCamperplaceMaxIndex();
        return String.valueOf(Integer.parseInt(maxIndex) + 1);
    }

    public List<CamperPlace> updateAll(List<CamperPlaceDTO> camperPlaceDtos) {
        try {
            var cpToUpdate = new ArrayList<CamperPlace>();
            camperPlaceDtos.forEach(dto -> {
                validateIndex(dto.index());
                var cp = mapToCamperPlace(dto);
                cpToUpdate.add(cp);
            });
            return super.update(cpToUpdate);
        } catch (DataIntegrityViolationException e) {
            var cause =  e.getMostSpecificCause();
            if (cause instanceof SQLIntegrityConstraintViolationException sqlEx && DUPLICATE_ENTRY == sqlEx.getErrorCode()) {
                throw new UserInputException("Parcela z podanym indexem już istnieje");
            }
            throw new IllegalStateException();
        }
    }

    private @NonNull CamperPlace mapToCamperPlace(CamperPlaceDTO dto) {
        var cp = findById(dto.id());
        var cpt = camperPlaceTypeService.findById(dto.camperPlaceType().id());
        cp.setCamperPlaceType(cpt);
        cp.setIndex(dto.index());
        cp.setPrice(cpt.getPrice().compareTo(dto.price()) == 0 ? null : dto.price());
        return cp;
    }

    public List<CamperPlace> findAllOrderByIndex() {
        return camperPlaceRepository.findAllOrderByIndex();
    }

    public List<CamperPlace> findCamperPlaceByPriceNotNullAndCamperPlaceType_Id(Integer id) {
        return camperPlaceRepository.findCamperPlaceByPriceNotNullAndCamperPlaceType_Id(id);
    }

    public List<List<LocalDate>> getOccupiedDates(Integer cpId) {
        return getOccupiedDates(cpId, null);
    }

    public List<List<LocalDate>> getOccupiedDates(Integer cpId, Integer reservationId) {
        return camperPlaceRepository.getOccupiedDates(cpId, reservationId).stream()
                .collect(
                        Collectors.groupingBy(
                            CamperPlaceRepository.OccupiedDateRow::getReservationId,
                            LinkedHashMap::new,
                            Collectors.mapping(CamperPlaceRepository.OccupiedDateRow::getOcpDate, Collectors.toList())
                        )
                ).values().stream().toList();
    }

    public boolean hasOverlappingReservation(Integer cpId, LocalDate checkin, LocalDate checkout, Integer reservationId) {
        return camperPlaceRepository.countOverlappingReservations(cpId, checkin, checkout, reservationId) > 0;
    }

    public BigDecimal getCalculatedReservationPrice(Integer cpId, LocalDate checkin, LocalDate checkout) {
        if (!checkout.isAfter(checkin)) {
            throw new UserInputException("Data wyjazdu musi być po dacie wjazdu");
        }
        final var price = findById(cpId).getPrice();
        final var daysInReservation = checkin.datesUntil(checkout).count();
        return reservationCalculatorService.calculate(price, daysInReservation);
    }
    public List<CamperPlace> getAvailableCamperPlaces(LocalDate from, LocalDate to) {
        return camperPlaceRepository.getAvailableCamperPlaces(from, to);
    }
    @Override
    protected CRUDRepository<CamperPlace> getRepository() {
        return camperPlaceRepository;
    }

}

