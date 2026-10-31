package pl.parceo.model.dto;

public class AuthDTO {
    public record LoginRequest(String login, String password) {
    }

    public record Response(String message, String token) {
    }
}