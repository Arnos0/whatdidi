# Frontend Code Review & Audit Command

Conduct a comprehensive frontend code review and audit of the entire codebase. Analyze the following aspects:

## 1. Code Structure & Architecture (25 points)
- Component organization and file structure
- Separation of concerns (presentation vs logic)
- Code reusability and DRY principles
- Module organization and dependencies
- Proper use of React patterns and best practices

## 2. Performance Optimization (20 points)
- Bundle size and code splitting
- Lazy loading implementation
- Image optimization
- Render optimization (memoization, useMemo, useCallback)
- Network request optimization
- Caching strategies

## 3. Accessibility (15 points)
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management
- Alt texts and semantic HTML

## 4. Responsive Design (10 points)
- Mobile-first approach
- Breakpoint consistency
- Touch target sizes
- Viewport handling
- Cross-device testing

## 5. SEO & Meta Tags (10 points)
- Meta tags implementation
- Open Graph tags
- Structured data
- Sitemap and robots.txt
- Page titles and descriptions
- Canonical URLs

## 6. Security Best Practices (10 points)
- XSS prevention
- Input validation
- Secure data handling
- Authentication implementation
- API security
- Environment variable management

## 7. Code Quality & Maintainability (10 points)
- TypeScript usage and type safety
- Code documentation
- Naming conventions
- Error handling
- Testing coverage
- Linting and formatting

## 8. State Management (bonus 5 points)
- Appropriate state management choice
- Data flow clarity
- State persistence where needed
- Optimistic updates
- Cache management

## 9. User Experience (bonus 5 points)
- Loading states
- Error states
- Empty states
- Animations and transitions
- Form validation feedback
- Overall polish

## 10. Modern Web Standards (bonus 5 points)
- Progressive Web App features
- Web Vitals optimization
- Modern CSS features
- Browser compatibility
- Future-proof patterns

## Deliverables

1. **Detailed Report**: Create a comprehensive markdown report covering all aspects above with:
   - Current state analysis
   - Issues identified
   - Recommendations for improvement
   - Priority ranking of fixes
   - Code examples where relevant

2. **Score Summary**: Provide a score out of 100 (base) + 15 (bonus) for each category

3. **Action Items**: List of prioritized improvements with effort estimates

4. **Best Practices Guide**: Document any patterns that should be followed going forward

## Review Process

1. Analyze the codebase systematically
2. Check for common frontend pitfalls
3. Evaluate against modern best practices
4. Consider the specific needs of the application
5. Provide actionable feedback

## Focus Areas

- **Performance**: Is the app fast and responsive?
- **Accessibility**: Can everyone use the app effectively?
- **Maintainability**: Is the code easy to work with?
- **User Experience**: Is the app pleasant to use?
- **Security**: Is user data protected?
- **SEO**: Is the app discoverable?
- **Modern Standards**: Does it follow current best practices?

Generate a comprehensive report that can be used to improve the overall quality of the frontend codebase. Be specific with examples and provide clear, actionable recommendations.