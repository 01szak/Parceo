package pl.parceo.controller;

import pl.parceo.exception.UserNotFoundException;
import pl.parceo.model.constant.Operation;
import pl.parceo.model.dto.UserDTO;
import pl.parceo.service.core.SearchCriteria;
import pl.parceo.service.core.UserService;
import pl.parceo.service.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public UserDTO getUser(@AuthenticationPrincipal Jwt jwt) {
        var username = jwt.getClaimAsString("sub");

        return userService.findBy(SearchCriteria.builder()
                        .key("login")
                        .operation(Operation.EQUALS)
                        .value(username)
                        .build())
                .map(DtoMapper::getUserDTO)
                .stream()
                .findFirst()
                .orElseThrow(() -> new UserNotFoundException("Zalogowany użytkownik nie istnieje już w systemie"));
    }
}
