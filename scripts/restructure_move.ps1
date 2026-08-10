# PowerShell script to move project files into the new structure
# Run from the project root (hilal_meet)

# Create necessary directories (already exist from previous task but ensure)
$dirs = @(
    'apps\store\pages',
    'apps\store\components',
    'apps\store\css',
    'apps\store\css\pages',
    'apps\store\js',
    'apps\store\js\modules',
    'apps\store\js\services',
    'apps\store\js\ui',
    'apps\store\js\utils',
    'apps\store\js\config',
    'apps\store\assets\images',
    'apps\store\assets\icons',
    'apps\store\assets\fonts',
    'apps\admin\pages',
    'apps\admin\components',
    'apps\admin\css',
    'apps\admin\js',
    'apps\admin\js\modules',
    'apps\admin\js\services',
    'apps\admin\assets\images',
    'apps\admin\assets\icons'
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Path $d -Force | Out-Null }

# Move Store HTML pages
Move-Item -Path 'public\*.html' -Destination 'apps\store\pages' -Force -ErrorAction SilentlyContinue

# Move Store component HTML files
$storeComponents = @('navbar.html','footer.html','product-card.html','product-modal.html','cart-sidebar.html','loader.html','toast.html')
foreach ($c in $storeComponents) {
    Move-Item -Path "public\$c" -Destination 'apps\store\components' -Force -ErrorAction SilentlyContinue
}

# Move Store CSS files
Move-Item -Path 'public\css\*.css' -Destination 'apps\store\css' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\css\pages\*' -Destination 'apps\store\css\pages' -Force -ErrorAction SilentlyContinue

# Move Store JS hierarchy (assuming existing under public\js)
Move-Item -Path 'public\js\main.js' -Destination 'apps\store\js' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\js\modules\*' -Destination 'apps\store\js\modules' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\js\services\*' -Destination 'apps\store\js\services' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\js\ui\*' -Destination 'apps\store\js\ui' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\js\utils\*' -Destination 'apps\store\js\utils' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\js\config\*' -Destination 'apps\store\js\config' -Force -ErrorAction SilentlyContinue

# Move Store assets
Move-Item -Path 'public\images\*' -Destination 'apps\store\assets\images' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\icons\*' -Destination 'apps\store\assets\icons' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\fonts\*' -Destination 'apps\store\assets\fonts' -Force -ErrorAction SilentlyContinue

# Move Admin content (if present)
Move-Item -Path 'public\admin\*.html' -Destination 'apps\admin\pages' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\admin\components\*' -Destination 'apps\admin\components' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\admin\css\*' -Destination 'apps\admin\css' -Force -ErrorAction SilentlyContinue
Move-Item -Path 'public\admin\js\*' -Destination 'apps\admin\js' -Force -ErrorAction SilentlyContinue

# Cleanup now-empty public folder
if (Test-Path 'public') { Remove-Item -Path 'public' -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "Restructuring complete."
