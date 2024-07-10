from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_marshmallow import Marshmallow
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:1234@localhost/project'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
ma = Marshmallow(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})



class Users(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, unique=True)
    name = db.Column(db.String(50), unique=True)
    email = db.Column(db.String(20), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    expenses = db.relationship('Expenses', backref='user', lazy=True)

    def __init__(self, name, email):
        self.name = name
        self.email = email


class Categories(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True, unique=True)
    name = db.Column(db.String(50), unique=True)
    expenses = db.relationship('Expenses', backref='category', lazy=True)

    def __init__(self, name):
        self.name = name


class Expenses(db.Model):
    __tablename__ = "expenses"
    id = db.Column(db.Integer, primary_key=True, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expense_name = db.Column(db.String(50))
    value = db.Column(db.Float)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, user_id, expense_name, value, category_id):
        self.user_id = user_id
        self.expense_name = expense_name
        self.value = value
        self.category_id = category_id


class UserSchema(ma.Schema):
    class Meta:
        fields = ['id', 'name', 'email', 'date']


class ExpenseSchema(ma.Schema):
    class Meta:
        fields = ['id', 'user_id', 'expense_name', 'value', 'category_id', 'timestamp']


user_schema = UserSchema()
users_schema = UserSchema(many=True)
expense_schema = ExpenseSchema()
expenses_schema = ExpenseSchema(many=True)

@app.route("/")
def index():
    return render_template('G:\\New Projects\\expense tracker ref\\Hackathon-Pro\\index.html')


@app.route('/listusers', methods=['GET'])
def listusers():
    all_users = Users.query.all()
    results = users_schema.dump(all_users)
    return jsonify(results)


@app.route('/userdetail/<id>', methods=['GET'])
def userdetail(id):
    show_user = Users.query.get(id)
    results = user_schema.dump(show_user)
    return jsonify(results)


@app.route('/updateuser/<id>', methods=['PUT'])
def updateuser(id):
    user = Users.query.get(id)

    name = request.json['name']
    email = request.json['email']

    user.name = name
    user.email = email

    db.session.commit()

    return user_schema.jsonify(user)


@app.route('/adduser', methods=['POST'])
def useradd():
    try:
        name = request.json['name']
        email = request.json['email']

        # Check if the user already exists
        existing_user = Users.query.filter_by(email=email).first()

        if existing_user:
            return jsonify({'message': 'User already exists'}), 400

        new_user = Users(name, email)
        db.session.add(new_user)
        db.session.commit()

        return user_schema.jsonify(new_user), 201
    except Exception as e:
        print("Error adding user:", str(e))
        return jsonify({"error": "Internal server error"}), 500

@app.route('/getuserid/<email>', methods=['GET'])
def get_user_id(email):
    try:
        user = Users.query.filter_by(email=email).first()
        if user:
            return jsonify({'userId': user.id}), 200
        else:
            return jsonify({'message': 'User not found'}), 404
    except Exception as e:
        print("Error fetching user:", str(e))
        return jsonify({"error": "Internal server error"}), 500

@app.route('/deleteuser/<id>', methods=['DELETE'])
def deleteuser(id):
    user = Users.query.get(id)
    db.session.delete(user)
    db.session.commit()
    return user_schema.jsonify(user)


@app.route('/addexpense', methods=['POST'])
def addexpense():
    try:
        user_id = request.json['user_id']
        expense_name = request.json['expense_name']
        value = request.json['value']
        category_id = request.json['category_id']

        print("Received category_id:", category_id)  # Debugging

        # Check if the category_id exists in the categories table
        category = Categories.query.get(category_id)
        if not category:
            return jsonify({'message': 'Invalid category ID'}), 400

        new_expense = Expenses(user_id, expense_name, value, category_id)
        db.session.add(new_expense)
        db.session.commit()

        return expense_schema.jsonify(new_expense), 201
    except Exception as e:
        print("Error adding expense:", str(e))
        return jsonify({"error": "Internal server error"}), 500

@app.route('/deleteexpense/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        expense = Expenses.query.get(expense_id)
        
        if not expense:
            return jsonify({'message': 'Expense not found'}), 404

        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
    except Exception as e:
        print("Error deleting expense:", str(e))
        return jsonify({"error": "Internal server error"}), 500


@app.route('/expensesforuser/<user_id>', methods=['GET'])
def expensesforuser(user_id):
    expenses = Expenses.query.filter_by(user_id=user_id).all()
    result = expenses_schema.dump(expenses)
    return jsonify(result)


@app.route('/expensesfordate/<user_id>/<selected_date>', methods=['GET'])
def expensesfordate(user_id, selected_date):
    # Assuming 'selected_date' is in the format 'YYYY-MM-DD'
    expenses = db.session.query(
        Expenses.id,
        Expenses.expense_name,
        Expenses.value,
        Categories.name.label('category_name'),
        Expenses.timestamp
    ).join(Categories, Expenses.category_id == Categories.id)\
    .filter(Expenses.user_id == user_id, Expenses.timestamp.cast(db.Date) == selected_date).all()

    result = expenses_schema.dump(expenses)
    return jsonify(result)


categories = ["Food", "Living expenses", "Misc", "Health expenses", "Transportation", "Fees"]
@app.route('/categories', methods=['GET'])
def get_categories():
    try: 
        all_categories = Categories.query.all()
        categories_list = [category.name for category in all_categories]
        return jsonify(categories_list)
    except Exception as e:
        print("Error fetching categories:", str(e))
        return jsonify({"error": "Internal server error"}), 500 

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True))
    
