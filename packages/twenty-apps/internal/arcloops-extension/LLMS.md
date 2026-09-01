## Base documentation

- Documentation: https://docs.twenty.com/developers/extend/apps/getting-started
- Hello-world example: packages/twenty-apps/examples/hello-world
- Rich app example: https://github.com/twentyhq/twenty/tree/main/packages/twenty-apps/fixtures/rich-app

## UUID requirement

- All generated UUIDs must be valid UUID v4.

## Common Pitfalls

- Creating a view without a navigationMenuItem associated. This will make the view unavailable on the left sidebar.
- Logic functions must not import from `twenty-shared` directly.
