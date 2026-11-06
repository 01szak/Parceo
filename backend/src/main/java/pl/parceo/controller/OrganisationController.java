package pl.parceo.controller;

import pl.parceo.model.dto.OrganisationDTO;
import pl.parceo.service.core.OrganisationService;
import pl.parceo.service.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organisation")
@RequiredArgsConstructor
public class OrganisationController {

    private final OrganisationService organisationService;

    @GetMapping
    public OrganisationDTO getOrganisation() {
        return DtoMapper.getOrganisationDTO(organisationService.findLoggedInUserOrganisation());
    }

}
