package com.example.pennywise.category;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/categories")
public class CategoryController {
    private final CategoryService service;
    public CategoryController(CategoryService service) { this.service = service; }
    @GetMapping public List<CategoryResponse> list() { return service.list(); }
    @GetMapping("/{id}") public CategoryResponse get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) { return service.create(request); }
    @PutMapping("/{id}") public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
