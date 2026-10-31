package pl.parceo.controller;

import pl.parceo.model.dto.AuthDTO;
import pl.parceo.service.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDTO.LoginRequest credentials) throws IllegalAccessException {
        final var a = new UsernamePasswordAuthenticationToken(credentials.login(), credentials.password());
        final var authentication = authenticationManager.authenticate(a);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return ResponseEntity.ok(new AuthDTO.Response("Authenticated", jwtService.generateToken(authentication)));
    }

//    @PostMapping("/register")
//    public ResponseEntity<?> register(@RequestBody AuthDTO.RegisterRequest request) throws SQLIntegrityConstraintViolationException {
//        User user;
//        userService.create(
//                user = User.builder()
//                        .firstName(request.firstName())
//                        .lastName(request.lastName())
//                        .email(request.email())
//                        .phoneNumber(request.phoneNumber())
//                        .carRegistration(request.carRegistration())
//                        .country(request.country())
//                        .city(request.city())
//                        .streetAddress(request.streetAddress())
//                        .password(request.password())
//                        .reservations(new ArrayList<Reservation>())
//                        .employeeRole(EmployeeRole.GUEST)
//                        .build()
//        );
//        UsernamePasswordAuthenticationToken a = new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword());
//        Authentication authentication = authenticationManager.authenticate(a);
//        SecurityContextHolder.getContext().setAuthentication(authentication);
//
//        String token = jwtTokenService.generateToken(authentication);
//        return ResponseEntity.ok(new AuthDTO.Response("Registered", token));
//
//    }

}
