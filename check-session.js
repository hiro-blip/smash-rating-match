// Supabaseのmatch_sessionsテーブルの内容を確認するスクリプト
console.log('Supabase接続確認用スクリプト');
console.log('ブラウザのコンソールで以下を実行してください:');
console.log('');
console.log('const { createClient } = supabase;');
console.log('const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);');
console.log('const data = await supabaseClient.from("match_sessions").select("*");');
console.log('console.log(data);');
