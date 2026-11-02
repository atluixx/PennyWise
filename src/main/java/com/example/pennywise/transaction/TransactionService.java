package com.example.pennywise.transaction;

import java.util.List;
import com.example.pennywise.auth.CurrentUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.pennywise.category.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class TransactionService {
    private final TransactionRepository transactions;
    private final CategoryService categories;
    private final IdempotencyRepository idempotency;
    private final ObjectMapper mapper;
    private final CurrentUser currentUser;
    public TransactionService(TransactionRepository transactions, CategoryService categories, IdempotencyRepository idempotency, ObjectMapper mapper, CurrentUser currentUser) {
        this.transactions = transactions; this.categories = categories; this.idempotency = idempotency; this.mapper = mapper; this.currentUser = currentUser;
    }
    private FinanceTransaction entity(Long id) {
        return transactions.findByIdAndOwnerId(id, currentUser.id()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
    }
    public List<TransactionResponse> list() { return transactions.findAllByOwnerId(currentUser.id()).stream().map(TransactionResponse::from).toList(); }
    public TransactionResponse get(Long id) { return TransactionResponse.from(entity(id)); }
    public TransactionResponse create(TransactionRequest request, String key) {
        if (key == null) return createTransaction(request);
        if (key.isBlank() || key.length() > 128 || !key.matches("[A-Za-z0-9._~-]+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Idempotency-Key");
        }
        try {
            String requestJson = mapper.writeValueAsString(request);
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(requestJson.getBytes(StandardCharsets.UTF_8)));
            String scopedKey = currentUser.id() + ":" + key;
            var existing = idempotency.findById(scopedKey);
            if (existing.isPresent()) {
                if (!existing.get().getRequestHash().equals(hash)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Idempotency-Key already used for a different request");
                }
                return mapper.readValue(existing.get().getResponseJson(), TransactionResponse.class);
            }
            TransactionResponse response = createTransaction(request);
            idempotency.save(new IdempotencyRecord(scopedKey, hash, mapper.writeValueAsString(response)));
            return response;
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            throw new IllegalStateException("Could not process idempotency record", e);
        }
    }
    private TransactionResponse createTransaction(TransactionRequest request) {
        return TransactionResponse.from(transactions.save(new FinanceTransaction(request.amount(), request.type(), request.transactionDate(), request.description(), categories.getEntity(request.categoryId()), currentUser.id())));
    }
    public TransactionResponse update(Long id, TransactionRequest request) {
        FinanceTransaction transaction = entity(id);
        transaction.update(request.amount(), request.type(), request.transactionDate(), request.description(), categories.getEntity(request.categoryId()));
        return TransactionResponse.from(transactions.save(transaction));
    }
    public void delete(Long id) { transactions.delete(entity(id)); }
}
