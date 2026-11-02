package com.example.pennywise.transaction;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
public class TransactionController {
    private final TransactionService service;
    public TransactionController(TransactionService service) { this.service = service; }
    @GetMapping public List<TransactionResponse> list() { return service.list(); }
    @GetMapping("/{id}") public TransactionResponse get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public synchronized TransactionResponse create(@Valid @RequestBody TransactionRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) { return service.create(request, key); }
    @PutMapping("/{id}") public TransactionResponse update(@PathVariable Long id, @Valid @RequestBody TransactionRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
