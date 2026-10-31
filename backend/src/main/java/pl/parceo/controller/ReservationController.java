package pl.parceo.controller;

import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.dto.SearchRequest;
import pl.parceo.service.core.ReservationService;
import pl.parceo.service.util.DtoMapper;
import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/reservation")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<Map<String, String>> create(@RequestBody @Valid ReservationDTO reservationDto) {
        reservationService.create(reservationDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success","Rezerwacja została dodana"));
    }

    @PatchMapping
    public ResponseEntity<Map<String, String>> update(@RequestBody @Valid ReservationDTO reservationDto) {
        reservationService.update(reservationDto);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Rezerwacja została zmieniona"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        reservationService.deleteById(id);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Rezerwacja została usunięta"));
    }

    @PostMapping("/findBy")
    public Page<ReservationDTO> findBy(@Nullable Pageable pageable, @RequestBody @Valid SearchRequest searchRequest) {
        return reservationService.findBy(
                pageable,
                searchRequest.searchCriteria()
        ).map(DtoMapper::getReservationDto);
    }

}
