package pl.parceo.exception;

import pl.parceo.model.constant.Operation;

import java.util.Arrays;

public class UnsupportedSqlOperationException extends ClientSideException {

    public UnsupportedSqlOperationException() {
        super("Unsupported operation was used. The supported Operations are: " + Arrays.toString(Operation.values()));
    }

}
