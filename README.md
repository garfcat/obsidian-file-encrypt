# Obsidian File Encryption Plugin

[English](#english) | [中文](README_ZH.md)

## English

A plugin for Obsidian that allows you to encrypt and decrypt your notes with a password.

### Features

- Encrypt and decrypt files with AES encryption
- Keyboard shortcuts support (Ctrl/Cmd + Shift + E to encrypt, Ctrl/Cmd + Shift + D to decrypt)
- Visual indicators for encrypted files
- Automatic backup before encryption (optional)
- Read-only mode for encrypted files
- Status bar indicator showing current file encryption status

### Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "File Encryption"
4. Install the plugin and enable it

### Usage

1. Open the file you want to encrypt
2. Use one of these methods to encrypt:
   - Press Ctrl/Cmd + Shift + E
   - Use the command palette and search for "Encrypt current file"
3. Enter your password in the popup dialog
4. To decrypt, use Ctrl/Cmd + Shift + D or the command palette

### Settings

- **Encryption Marker**: Customize the marker used to identify encrypted files
- **Show Encryption Warnings**: Toggle warnings about file encryption status
- **Backup Before Encryption**: Enable/disable automatic file backup before encryption

### Security Notes

- Remember your password! There's no way to recover encrypted content without it
- The plugin uses AES encryption for secure file protection
- Always backup important files before encryption

## Support

If you encounter any issues or have suggestions:
- Submit an issue on [GitHub](https://github.com/garfcat/obsidian-file-encrypt/issues)
- Contact the author via Email

## License

[MIT License](LICENSE)

Copyright (c) 2023 garfcat
