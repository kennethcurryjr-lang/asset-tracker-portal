                  {/* Crunched Operations Rows */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input placeholder="Rename Asset..." value={tagInputs[item.deviceId.slice(-5)] || ""} onChange={(e) => setTagInputs(prev => ({...prev, [item.deviceId.slice(-5)]: e.target.value}))} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f5f5f7' }} />
                      <button onClick={() => updateAttribute(item.deviceId, "LATEST", 'tag', tagInputs[item.deviceId.slice(-5)], '#t')} style={{ ...primaryButtonStyle, padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>Save</button>
                  </div>
