package pl.parceo.controller;

import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.SearchRequest;
import pl.parceo.service.core.GuestService;
import pl.parceo.service.util.DtoMapper;
import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/guest")
@RequiredArgsConstructor
public class GuestController {

    private final GuestService guestService;

    @PostMapping("/findBy")
    public Page<GuestDTO> findBy(@Nullable Pageable pageable, @RequestBody @Valid SearchRequest searchRequest) {
        return guestService.findBy(pageable, searchRequest.searchCriteria()).map(DtoMapper::getGuestDTO);
    }

    @PatchMapping
    public ResponseEntity<Map<String, String>> update(@RequestBody @Valid GuestDTO guestDTO){
        guestService.update(guestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Gość został zmieniony"));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> create(@RequestBody @Valid GuestDTO guestDTO) {
        guestService.create(guestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success","Gość został utworzony"));
    }

    @GetMapping("/{id}")
    public GuestDTO getGuestById(@PathVariable int id){
        return DtoMapper.getGuestDTO(guestService.findById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteGuest(@PathVariable int id){
        guestService.deleteById(id);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Gość został usunięty"));
    }
}





