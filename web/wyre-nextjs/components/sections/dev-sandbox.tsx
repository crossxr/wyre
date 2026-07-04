"use client"

import React, { useState } from 'react'

export const DevSandbox: React.FC = () => {
  const [activeDevTab, setActiveDevTab] = useState<'start-server' | 'middleware' | 'json-helpers'>('start-server');

  const getCodeSnippet = () => {
    if (activeDevTab === 'start-server') {
      return `package main

import (
	"context"
	"log"
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	router.HandleFunc("GET", "/", func(w *wyre.ResponseWriter, r *wyre.Request) {
		w.WriteFixedBody(200, "text/plain", []byte("wyre is alive"))
	})

	cfg := wyre.DefaultConfig(":8080")
	cfg.Handler = router

	srv := wyre.NewWithConfig(cfg)
	log.Fatal(srv.ListenAndServeTLS("cert.pem", "key.pem"))
}`;
    }

    if (activeDevTab === 'middleware') {
      return `// Register robust security and metrics middlewares
router := wyre.NewRouter()

router.Use(wyre.Recovery())

router.Use(wyre.CORS(wyre.CORSConfig{
	AllowedOrigins: []string{"*"},
	AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	AllowedHeaders: []string{"Content-Type", "Authorization"},
}))`;
    }

    return `// Using built-in JSON marshalling helpers
type User struct {
	Name string \`json:"name"\`
}

type Greeting struct {
	Msg string \`json:"msg"\`
}

router.HandleFunc("POST", "/json", func(w *wyre.ResponseWriter, r *wyre.Request) {
	var user User
	if err := r.ReadJSON(&user); err != nil {
		w.WriteFixedBody(400, "text/plain", []byte("bad json"))
		return
	}

	w.WriteJSON(201, Greeting{Msg: "hello " + user.Name})
})`;
  };

  return (
    <section className="dev-section" id="developers">
      <div className="container dev-layout">
        <div className="dev-info">
          <span className="eyebrow section-eyebrow">Interactive APIs</span>
          <h2 className="heading-lg section-title">Code-first server setup.</h2>
          <p className="body-text">
            Wyre provides clean, explicit, self-documenting APIs so that human developers and AI agents can build and deploy with confidence.
          </p>

          <div className="dev-tabs">
            <div
              onClick={() => setActiveDevTab('start-server')}
              className={`dev-tab-item ${activeDevTab === 'start-server' ? 'active' : ''}`}
            >
              <span className="dev-tab-name" style={{ fontSize: '14px', fontWeight: 'bold' }}>Start Server (TLS)</span>
            </div>

            <div
              onClick={() => setActiveDevTab('middleware')}
              className={`dev-tab-item ${activeDevTab === 'middleware' ? 'active' : ''}`}
            >
              <span className="dev-tab-name" style={{ fontSize: '14px', fontWeight: 'bold' }}>Recovery & CORS Middleware</span>
            </div>

            <div
              onClick={() => setActiveDevTab('json-helpers')}
              className={`dev-tab-item ${activeDevTab === 'json-helpers' ? 'active' : ''}`}
            >
              <span className="dev-tab-name" style={{ fontSize: '14px', fontWeight: 'bold' }}>JSON Marshalling Helpers</span>
            </div>
          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="card dev-code-card">
          <div className="code-card-header">
            <span className="font-mono text-caption" style={{ color: 'var(--color-ash)', textTransform: 'uppercase' }}>
              GO SOURCE CODE
            </span>
          </div>

          <div className="code-block-wrapper">
            <pre className="code-block" style={{ margin: 0 }}>
              <code style={{ fontSize: '13px', lineHeight: 1.5, color: '#e0e0e0' }}>
                {getCodeSnippet()}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
