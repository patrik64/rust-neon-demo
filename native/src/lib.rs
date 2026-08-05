use std::collections::HashMap;

use neon::prelude::*;
use sha2::{Digest, Sha256};

/// Basic value passing: take a JS string, return a JS string.
fn greet(mut cx: FunctionContext) -> JsResult<JsString> {
    let name = cx.argument::<JsString>(0)?.value(&mut cx);
    Ok(cx.string(format!("Hello, {name}! Greetings from Rust 🦀")))
}

fn sieve(limit: usize) -> u64 {
    if limit < 2 {
        return 0;
    }
    let mut is_composite = vec![false; limit + 1];
    let mut count = 0u64;
    for n in 2..=limit {
        if !is_composite[n] {
            count += 1;
            let mut multiple = n * n;
            while multiple <= limit {
                is_composite[multiple] = true;
                multiple += n;
            }
        }
    }
    count
}

/// CPU-bound work executed synchronously on the JS thread.
fn count_primes(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let limit = cx.argument::<JsNumber>(0)?.value(&mut cx) as usize;
    Ok(cx.number(sieve(limit) as f64))
}

/// The same work scheduled on Node's worker thread pool via `cx.task`,
/// resolved back to JS as a Promise — the event loop stays free.
fn count_primes_async(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let limit = cx.argument::<JsNumber>(0)?.value(&mut cx) as usize;
    let promise = cx
        .task(move || sieve(limit))
        .promise(|mut cx, count| Ok(cx.number(count as f64)));
    Ok(promise)
}

/// Build and return a structured JS object from Rust data.
fn word_stats(mut cx: FunctionContext) -> JsResult<JsObject> {
    let text = cx.argument::<JsString>(0)?.value(&mut cx);
    let top_n = cx.argument::<JsNumber>(1)?.value(&mut cx) as usize;

    let mut counts: HashMap<String, u64> = HashMap::new();
    let mut total = 0u64;
    for word in text
        .split(|c: char| !c.is_alphanumeric() && c != '\'')
        .filter(|w| !w.is_empty())
    {
        total += 1;
        *counts.entry(word.to_lowercase()).or_insert(0) += 1;
    }

    let mut ranked: Vec<(String, u64)> = counts.into_iter().collect();
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));

    let obj = cx.empty_object();
    let total_words = cx.number(total as f64);
    obj.set(&mut cx, "totalWords", total_words)?;
    let unique_words = cx.number(ranked.len() as f64);
    obj.set(&mut cx, "uniqueWords", unique_words)?;

    let top = cx.empty_array();
    for (i, (word, count)) in ranked.into_iter().take(top_n).enumerate() {
        let entry = cx.empty_object();
        let w = cx.string(word);
        entry.set(&mut cx, "word", w)?;
        let c = cx.number(count as f64);
        entry.set(&mut cx, "count", c)?;
        top.set(&mut cx, i as u32, entry)?;
    }
    obj.set(&mut cx, "topWords", top)?;

    Ok(obj)
}

/// Use any crates.io dependency (here `sha2`) behind a JS-callable function.
fn sha256_hex(mut cx: FunctionContext) -> JsResult<JsString> {
    let text = cx.argument::<JsString>(0)?.value(&mut cx);
    let rounds = cx.argument::<JsNumber>(1)?.value(&mut cx) as u32;

    let mut digest = Sha256::digest(text.as_bytes());
    for _ in 1..rounds.max(1) {
        digest = Sha256::digest(digest);
    }

    let hex: String = digest.iter().map(|b| format!("{b:02x}")).collect();
    Ok(cx.string(hex))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("greet", greet)?;
    cx.export_function("countPrimes", count_primes)?;
    cx.export_function("countPrimesAsync", count_primes_async)?;
    cx.export_function("wordStats", word_stats)?;
    cx.export_function("sha256", sha256_hex)?;
    Ok(())
}
