exports.chrome = {
  find: function() {
    // Joined with filename (or [browser name].exe)
    this.dir('ProgramFiles_x86', 'Google\\Chrome\\Application')
    this.dir('LOCALAPPDATA',     'Google\\Chrome\\Application')

    // Expanded to HKEY_LOCAL_MACHINE and HKEY_CURRENT_USER
    this.registry('"%s\\Software\\Google\\Update" /v LastInstallerSuccessLaunchCmdLine')
    this.registry('"%s\\Software\\Classes\\ChromeHTML\\shell\\open\\command"')

    this.startMenu('Google Chrome')
    
    if (process.arch == 'x64') {
      this.registry('"%s\\Software\\Wow6432Node\\Google\\Update" /v LastInstallerSuccessLaunchCmdLine')
      // Parsing this seems to fail, needs testing
      this.registry('"%s\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe"')
    }
  }
}

exports.chromium = {
  bin: 'chrome.exe',
  find: function() {
    this.dir('LOCALAPPDATA', 'Chromium\\Application')
    this.registry('"%s\\Software\\Chromium" /v InstallerSuccessLaunchCmdLine')

    // Unconfirmed
    if (process.arch == 'x64') {
      this.registry('"%s\\Software\\Wow6432Node\\Chromium" /v InstallerSuccessLaunchCmdLine')
    }
  }
}

exports.firefox = {
  // Unreliable: getVersion: '-v | more',
  find: function() {
    this.dir('ProgramFiles_x86', 'Mozilla Firefox')
    
    this.startMenu()
    this.registry('"%s\\Software\\Mozilla\\Mozilla Firefox\\" /s /v PathToExe')
    
    this.versionRegistry(
      // First get version, then path
      '"%s\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion',
      '"%s\\Software\\Mozilla\\Mozilla Firefox\\%s\\Main\\" /s /v PathToExe'
    )
  }
}

exports.ie = { 
  bin: 'iexplore.exe',
  find: function() {
    this.dir('ProgramFiles_x86', 'Internet Explorer')
    this.startMenu()

    if (process.arch == 'x64')
      this.dir('ProgramFiles_x64', 'Internet Explorer')
  }
}

exports.phantomjs = {
  getVersion: '-v',
  bin: 'phantomjs',
  find: function() {
    this.file(process.cwd()+'\\node_modules\\.bin\\phantomjs.cmd')
  }
}

exports.opera = {
  bin: 'Launcher.exe',
  find: function() {
    this.dir('ProgramFiles_x86', 'Opera')
    this.registry('"%s\\Software\\Clients\\StartMenuInternet\\OperaStable\\shell\\open\\command"')
    this.registry('"%s\\Software\\Classes\\OperaStable\\shell\\open\\command"')

    this.dir('ProgramFiles_x86', 'Opera beta')
    this.registry('"%s\\Software\\Clients\\StartMenuInternet\\OperaBeta\\shell\\open\\command"')
    this.registry('"%s\\Software\\Classes\\OperaBeta\\shell\\open\\command"')

    this.dir('ProgramFiles_x86', 'Opera developer')
    this.registry('"%s\\Software\\Clients\\StartMenuInternet\\OperaDeveloper\\shell\\open\\command"')
    this.registry('"%s\\Software\\Classes\\OperaDeveloper\\shell\\open\\command"')
  }
}

// Untested and incomplete (Safari for Windows is dead anyway)
exports.safari = {
  find: function() {
    this.startMenu()
    this.registry('"%s\\Software\\Apple Computer, Inc.\\Safari" /v BrowserExe')
  }
}
