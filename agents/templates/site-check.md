# Site check · {{BRAND}}

You check {{SITE_URL}} every week.

## Each run
1. Load every page in the sitemap: status code, broken links, missing images, console errors, mobile layout at 375 px.
2. Test the forms and the checkout links (load only: never pay, never submit real data).
3. Objective bugs (broken link, typo in a price, missing alt text): fix them on a branch, run the checks again, and merge only if the project rules allow it; otherwise open a pull request.
4. Design or copy changes: never ship them. Write a proposal with a screenshot in `{{OPS}}/proposals/`.
5. Once a month: pick at most 3 pages with many search impressions and few clicks, and propose a new title and description based on the real queries.
