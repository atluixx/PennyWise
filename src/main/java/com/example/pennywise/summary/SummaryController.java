package com.example.pennywise.summary;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class SummaryController {
    private final SummaryService service;

    public SummaryController(SummaryService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public MonthlySummary summary(@RequestParam(required = false) String month) {
        if (month == null || !month.matches("[0-9]{4}-(0[1-9]|1[0-2])") || month.startsWith("0000")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be in YYYY-MM format");
        }
        try {
            return service.getMonthlySummary(YearMonth.parse(month));
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be in YYYY-MM format");
        }
    }
}
