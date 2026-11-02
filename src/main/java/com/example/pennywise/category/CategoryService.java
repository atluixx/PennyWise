package com.example.pennywise.category;

import java.util.List;
import com.example.pennywise.auth.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CategoryService {
    private final CategoryRepository categories;
    private final CurrentUser currentUser;
    public CategoryService(CategoryRepository categories, CurrentUser currentUser) { this.categories = categories; this.currentUser = currentUser; }
    public Category getEntity(Long id) {
        return categories.findByIdAndOwnerId(id, currentUser.id()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }
    public List<CategoryResponse> list() { return categories.findAllByOwnerId(currentUser.id()).stream().map(CategoryResponse::from).toList(); }
    public CategoryResponse get(Long id) { return CategoryResponse.from(getEntity(id)); }
    public CategoryResponse create(CategoryRequest request) { return CategoryResponse.from(categories.save(new Category(request.name(), currentUser.id()))); }
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getEntity(id);
        category.setName(request.name());
        return CategoryResponse.from(categories.save(category));
    }
    public void delete(Long id) { categories.delete(getEntity(id)); }
}
