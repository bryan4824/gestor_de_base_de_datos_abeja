from flask import Flask, render_template, request, jsonify
from flask_mysqldb import MySQL

app = Flask(__name__)

mysql=MySQL()
app.config["MYSQL_HOST"]='localhost'
app.config["MYSQL_PORT"]=3306
app.config["MYSQL_USER"]='root'
app.config["MYSQL_PASSWORD"]='1091521SQL#br'
app.config['MYSQL_DB'] = 'simulador_db'
app.config["MYSQL_CURSORCLASS"]='DictCursor'

mysql = MySQL(app)

@app.route('/')
def index():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SHOW DATABASES")
        databases = [db['Database'] for db in cursor.fetchall() if db['Database'] not in ('information_schema', 'mysql', 'performance_schema', 'sys')]
        cursor.close()
        return render_template('index.html', databases=databases)
    except Exception as e:
        return f"Error de conexión a la base de datos: {e}"

@app.route('/ejecutar-consulta', methods=['POST'])
def ejecutar_consulta():
    datos = request.json
    db_name = datos.get('db_name')
    query = datos.get('query')

    if not query:
        return jsonify({'error': 'La consulta no puede estar vacía'}), 400

    try:
        cursor = mysql.connection.cursor()
        # Si se especificó una base de datos, la usamos antes de ejecutar la consulta
        if db_name and db_name != 'simulador_db':
            cursor.execute(f"USE `{db_name}`")
        
        cursor.execute(query)
        
        # Commit para consultas que modifican datos (CREATE, INSERT, UPDATE, DELETE)
        if not query.strip().upper().startswith("SELECT"):
            mysql.connection.commit()
            
        resultados = None
        if query.strip().upper().startswith("SELECT") or query.strip().upper().startswith("SHOW"):
            resultados = cursor.fetchall()
            
        return jsonify({'message': 'Consulta ejecutada con éxito', 'resultados': resultados})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        if 'cursor' in locals():
            cursor.close()

if __name__ == '__main__':
    app.run(debug=True)

if __name__ == '__main__':
    app.run(debug=True)