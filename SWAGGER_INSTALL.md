# Swagger Setup - Installation Instructions

## Required Dependencies

Due to PowerShell execution policy restrictions, you need to manually install the required npm packages.

### Installation Command

Run the following command in your terminal (you may need to use CMD instead of PowerShell, or run PowerShell as Administrator):

```bash
npm install swagger-ui-express swagger-jsdoc && npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

### Alternative: Install Separately

If the combined command doesn't work, try installing them one at a time:

```bash
npm install swagger-ui-express
npm install swagger-jsdoc
npm install --save-dev @types/swagger-ui-express
npm install --save-dev @types/swagger-jsdoc
```

## Verification

After installation, the TypeScript errors in the following files should disappear:
- `src/app.ts`
- `src/shared/config/swagger.config.ts`

## Next Steps

Once packages are installed:
1. Start the dev server: `npm run dev`
2. Access Swagger UI: http://localhost:8000/api-docs
3. Test the documented auth endpoints

## Files Created

- ✅ `src/shared/config/swagger.config.ts` - Swagger configuration
- ✅ `src/modules/auth/interface/auth.swagger.ts` - Auth endpoints documentation
- ✅ `src/app.ts` - Updated with Swagger integration (lines 4-6, 46-51)
