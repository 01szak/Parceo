package pl.parceo.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String DEFAULT_MESSAGE_ERROR = "Wystąpił nieoczekiwany błąd";

    @ExceptionHandler(UserInputException.class)
    public ResponseEntity<String> handleValidationException(UserInputException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<String> handleAuthenticationExceptionException(AuthenticationException ex) {
        SecurityContextHolder.clearContext();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        var error = new StringBuilder();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(e -> {
                    error
                            .append(e.getField())
                            .append(" ")
                            .append(e.getDefaultMessage());
                });

        return ResponseEntity.badRequest().body(error.toString());
    }

    @ExceptionHandler(ClientSideException.class)
    public ResponseEntity<String> handleClientSideException(ClientSideException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<String> handleBadCredentialsException(BadCredentialsException ex) {
        SecurityContextHolder.clearContext();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Nieprawidłowy login lub hasło");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Brak uprawnień do wykonania tej operacji");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body("Nieprawidłowy format żądania");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalStateException(IllegalStateException ex) {
        log.error(ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(DEFAULT_MESSAGE_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleUnexpectedException(Exception ex) {
        log.error("Unhandled exception!", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(DEFAULT_MESSAGE_ERROR);
    }


}
