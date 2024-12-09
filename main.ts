import { App, Plugin, TFile, Notice, Modal, Setting, PluginSettingTab, MarkdownView, WorkspaceLeaf } from 'obsidian';
import { encrypt, decrypt } from './crypto';

interface EncryptSettings {
	defaultMarker: string;
	showEncryptedWarning: boolean;
	backupBeforeEncrypt: boolean;
}

const DEFAULT_SETTINGS: EncryptSettings = {
	defaultMarker: '---encrypted---\n',
	showEncryptedWarning: true,
	backupBeforeEncrypt: true
}

export default class FileEncryptPlugin extends Plugin {
	settings: EncryptSettings;
	private statusBarItem: HTMLElement;

	async onload() {
		await this.loadSettings();

		// 添加状态栏项目
		this.statusBarItem = this.addStatusBarItem();

		// 注册事件处理器
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file) {
					this.handleFileOpen(file);
				}
			})
		);

		// 添加设置面板
		this.addSettingTab(new FileEncryptSettingTab(this.app, this));

		// 添加加密命令
		this.addCommand({
			id: 'encrypt-file',
			name: '加密当前文件',
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "E" }],
			callback: async () => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					if (this.settings.backupBeforeEncrypt) {
						await this.backupFile(file);
					}
					const passwordModal = new PasswordModal(this.app, async (password) => {
						await this.encryptFile(file, password);
					});
					passwordModal.open();
				} else {
					new Notice('请先打开一个文件');
				}
			}
		});

		// 添加解密命令
		this.addCommand({
			id: 'decrypt-file',
			name: '解密当前文件',
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "D" }],
			callback: async () => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					const passwordModal = new PasswordModal(this.app, async (password) => {
						await this.decryptFile(file, password);
					});
					passwordModal.open();
				} else {
					new Notice('请先打开一个文件');
				}
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async backupFile(file: TFile) {
		const content = await this.app.vault.read(file);
		const backupFileName = `${file.basename}-backup-${Date.now()}.md`;
		await this.app.vault.create(backupFileName, content);
	}

	private async handleFileOpen(file: TFile) {
		const content = await this.app.vault.read(file);
		const isEncrypted = content.startsWith(this.settings.defaultMarker);

		// 更新状态栏
		this.updateStatusBar(isEncrypted);

		// 如果文件已加密，设置为只读
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view && isEncrypted) {
			// 添加只读类
			view.contentEl.addClass('encrypted-file-readonly');

			// 添加加密状态提示
			const container = view.containerEl;
			this.clearEncryptedNotice(container);

			const noticeEl = container.createEl('div', {
				cls: 'encrypted-notice',
				text: '🔒 此文件已加密（只读模式）'
			});

			// 添加解密按钮
			const decryptButton = noticeEl.createEl('button', {
				text: '解密文件'
			});
			decryptButton.onclick = () => {
				const passwordModal = new PasswordModal(this.app, async (password) => {
					await this.decryptFile(file, password);
				});
				passwordModal.open();
			};
		} else if (view) {
			// 如果文件未加密，移除只读类
			view.contentEl.removeClass('encrypted-file-readonly');
			this.clearEncryptedNotice(view.containerEl);
		}
	}

	private clearEncryptedNotice(container: HTMLElement) {
		const existingNotice = container.querySelector('.encrypted-notice');
		if (existingNotice) {
			existingNotice.remove();
		}
	}

	private updateStatusBar(isEncrypted: boolean) {
		this.statusBarItem.empty();
		if (isEncrypted) {
			this.statusBarItem.setText('🔒 已加密');
		} else {
			this.statusBarItem.setText('🔓 未加密');
		}
	}

	async encryptFile(file: TFile, password: string) {
		try {
			const content = await this.app.vault.read(file);

			if (content.startsWith(this.settings.defaultMarker)) {
				if (this.settings.showEncryptedWarning) {
					new Notice('文件已经被加密');
				}
				return;
			}

			const encrypted = await encrypt(content, password);
			const markedContent = this.settings.defaultMarker + encrypted;
			await this.app.vault.modify(file, markedContent);
			new Notice('文件加密成功');

			// 重新加载文件以更新UI状态
			await this.handleFileOpen(file);
		} catch (error) {
			new Notice('加密失败: ' + error.message);
		}
	}

	async decryptFile(file: TFile, password: string) {
		try {
			const content = await this.app.vault.read(file);

			if (!content.startsWith(this.settings.defaultMarker)) {
				if (this.settings.showEncryptedWarning) {
					new Notice('文件未被加密');
				}
				return;
			}

			const encryptedContent = content.substring(this.settings.defaultMarker.length);
			const decrypted = await decrypt(encryptedContent, password);

			if (!decrypted) {
				new Notice('密码错误或文件损坏');
				return;
			}

			await this.app.vault.modify(file, decrypted);
			new Notice('文件解密成功');

			// 重新加载文件以更新UI状态
			await this.handleFileOpen(file);
		} catch (error) {
			new Notice('解密失败: ' + error.message);
		}
	}
}

class FileEncryptSettingTab extends PluginSettingTab {
	plugin: FileEncryptPlugin;

	constructor(app: App, plugin: FileEncryptPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '文件加密设置' });

		new Setting(containerEl)
			.setName('加密标记')
			.setDesc('用于标识加密文件的标记（建议不要修改）')
			.addText(text => text
				.setPlaceholder('输入加密标记')
				.setValue(this.plugin.settings.defaultMarker)
				.onChange(async (value) => {
					this.plugin.settings.defaultMarker = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('显示加密状态警告')
			.setDesc('当文件已加密/未加密时显示提示')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showEncryptedWarning)
				.onChange(async (value) => {
					this.plugin.settings.showEncryptedWarning = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('加密前备份')
			.setDesc('在加密文件前创建备份')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.backupBeforeEncrypt)
				.onChange(async (value) => {
					this.plugin.settings.backupBeforeEncrypt = value;
					await this.plugin.saveSettings();
				}));
	}
}

class PasswordModal extends Modal {
	private password: string = '';
	private onSubmit: (password: string) => void;

	constructor(app: App, onSubmit: (password: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: '请输入密码' });

		new Setting(contentEl)
			.setName('密码')
			.addText((text) =>
				text
					.setPlaceholder('输入密码')
					.setValue(this.password)
					.onChange((value) => {
						this.password = value;
					})
					.inputEl.type = 'password'
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText('确定')
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.password);
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
