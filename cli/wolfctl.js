#!/usr/bin/env node
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const program = new Command();
program.version('0.4.0');

const API_URL = process.env.WOLF_API || 'http://localhost:3000/api';
const CONFIG_PATH = path.join(require('os').homedir(), '.wolf', 'config.json');

const getConfig = () => {
    if (fs.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    return {};
};

const saveConfig = (config) => {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

const authHeaders = () => {
    const config = getConfig();
    if (!config.token) {
        console.error('Not logged in. Run wolfctl login <token>');
        process.exit(1);
    }
    return { Authorization: `Bearer ${config.token}` };
};

program
  .command('login <token>')
  .description('Login to Wolf Hosting Platform')
  .action((token) => {
      saveConfig({ ...getConfig(), token });
      console.log('Successfully securely logged in.');
  });

program
  .command('init <name>')
  .description('Scaffold a new bot project')
  .option('-t, --type <type>', 'Type of bot (python or php)', 'python')
  .action((name, options) => {
      const dir = path.join(process.cwd(), name);
      fs.mkdirSync(dir);
      if (options.type === 'python') {
          fs.writeFileSync(path.join(dir, 'main.py'), '# Wolf Python Engine\nprint("Running")');
          fs.writeFileSync(path.join(dir, 'requirements.txt'), 'aiogram>=3.3.0');
      } else {
          fs.writeFileSync(path.join(dir, 'index.php'), '<?php\necho "Wolf PHP Engine Running";');
      }
      console.log(`Initialized ${options.type} bot in ./${name}`);
  });

program
  .command('deploy')
  .description('Deploy the bot from local directory')
  .action(async () => {
      const type = fs.existsSync('index.php') ? 'php' : 'python';
      console.log(`Detected ${type} bot. Beginning deployment...`);
      // ملاحضة بالانجليزي يعني مبرمج محترف وكذا : Actual payload pushing/zipping code expands here.
      try {
          const res = await axios.post(`${API_URL}/bots/deploy`, { type }, { headers: authHeaders() });
          console.log('Deployment triggered:', res.data);
      } catch (e) {
          console.error('Deployment failed:', e.response?.data?.error || e.message);
      }
  });

program
  .command('restart <botId>')
  .description('Restart a specific bot target via API')
  .action(async (botId) => {
      try {
          const res = await axios.post(`${API_URL}/bots/${botId}/action`, { action: 'start' }, { headers: authHeaders() });
          console.log(`Bot ${botId} restart queued.`);
      } catch (e) {
          console.error('Restart failed:', e.response?.data?.error || e.message);
      }
  });

program.parse(process.argv);
