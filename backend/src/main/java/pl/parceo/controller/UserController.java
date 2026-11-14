package pl.parceo.controller;

import pl.parceo.model.dto.UserDTO;
import pl.parceo.model.entity.User;
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
        return DtoMapper.getUserDTO((User) userService.loadUserByUsername(username));
    }
}
