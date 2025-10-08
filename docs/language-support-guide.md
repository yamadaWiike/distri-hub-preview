# Language Support Implementation Guide

## Overview

This guide details the implementation of multi-language support in the Baskit Distributor Hub application. The application now supports both Indonesian (id) and English (en) languages.

## Implemented Pages

The following pages have been fully updated with language support:

1. **Hubungi.tsx** (Contact page)
   - All UI text supports both languages
   - Form labels, placeholders and buttons translated
   - SEO metadata translated
   - Toast notifications translated

2. **Tentang.tsx** (About page)
   - All UI text translated
   - Company profile information available in both languages
   - Mission and vision statements translated
   - SEO metadata translated

3. **NotFound.tsx** (404 page)
   - Error messages translated
   - Navigation button text translated

4. **Profil.tsx** (Profile page)
   - Started implementation
   - Page title and headings translated
   - Success/error messages translated
   - Location detection messages translated

## Remaining Pages to Update

The following pages still need to be updated with language support:

1. **Admin.tsx**
2. **Daftar.tsx** (Register)
3. **Index.tsx** (Home)
4. **Masuk.tsx** (Login)
5. **ProdukDetail.tsx** (Product Detail)

## Implementation Pattern

For each page that needs language support:

1. Import the required hooks and translations:
```tsx
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
```

2. Use the hooks in the component:
```tsx
const { lang } = useLanguage();
const t = translations[lang];
```

3. Replace hardcoded text with translated versions:
```tsx
// Before
<h1>Masuk</h1>

// After
<h1>{lang === 'id' ? "Masuk" : "Login"}</h1>

// Or using the translations object
<h1>{t.login}</h1>
```

4. Update SEO metadata:
```tsx
<SEO 
  title={lang === 'id' ? "Judul Bahasa Indonesia" : "English Title"} 
  description={lang === 'id' ? "Deskripsi Bahasa Indonesia" : "English Description"} 
/>
```

5. Update form labels and placeholders:
```tsx
<Label>{lang === 'id' ? "Nama" : "Name"}</Label>
<Input placeholder={lang === 'id' ? "Masukkan nama" : "Enter name"} />
```

6. Update toast notifications:
```tsx
toast({ 
  title: lang === 'id' ? "Berhasil" : "Success", 
  description: lang === 'id' ? "Operasi berhasil" : "Operation successful" 
});
```

7. Update error messages:
```tsx
setError(lang === 'id' 
  ? "Terjadi kesalahan. Silakan coba lagi." 
  : "An error occurred. Please try again."
);
```

## Best Practices

1. Always add language dependency to useCallback and useEffect hooks:
```tsx
useCallback(() => {
  // Code that uses lang
}, [lang, otherDependencies]);
```

2. Update the translations.ts file when adding new text keys

3. For commonly used phrases, prefer using the t object:
```tsx
<Button>{t.submit}</Button>
```

4. For longer text, use conditional rendering based on language:
```tsx
<p>
  {lang === 'id' 
    ? "Teks panjang dalam bahasa Indonesia..." 
    : "Long text in English..."
  }
</p>
```

## Testing

To test language support:
1. Switch language using the language toggle in the navbar
2. Verify all text changes to the selected language
3. Test form submission and error scenarios in both languages
4. Check that SEO metadata updates correctly

## Utility Script

A helper script has been created to identify pages missing language support:
- Location: `scripts/check-language-support.js`
- Usage: Run the script to get a report of pages needing updates

---

Note: Remember to add the language dependency to all React hooks that use the lang variable to avoid stale closures.
