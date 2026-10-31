package pl.parceo.controller;

import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.service.core.CamperPlaceTypeService;
import pl.parceo.service.util.DtoMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/camperPlaceType")
@RequiredArgsConstructor
public class CamperPlaceTypeController {

    private final CamperPlaceTypeService camperPlaceTypeService;

    @GetMapping
    public List<CamperPlaceTypeDTO> getTypes() {
        return camperPlaceTypeService.findAll().map(DtoMapper::getCamperPlaceTypeDTO).toList();
    }

    @PatchMapping
    public ResponseEntity<Map<String, String>> update(
            @RequestBody @Valid List<CamperPlaceTypeDTO> camperPlaceTypeDTOs,
            @RequestParam(required = false) List<Integer> cpIdToOverride
    ) {
        camperPlaceTypeService.update(camperPlaceTypeDTOs, cpIdToOverride);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Zmiany zostały wprowadzone"));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> create(@RequestBody @Valid CamperPlaceTypeDTO camperPlaceTypeDTO) {
        camperPlaceTypeService.create(camperPlaceTypeDTO);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Nowy typ parceli został dodany"));
    }

    @DeleteMapping("/{cpTypeId}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable @NotNull Integer cpTypeId) {
        camperPlaceTypeService.deleteById(cpTypeId);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("success","Typ został usunięty"));
    }
}
